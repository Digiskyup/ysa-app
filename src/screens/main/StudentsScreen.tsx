import React, { useState, useCallback, useEffect } from 'react';
import {
  Layout,
  Text,
  Input,
  Icon,
  Button,
  Spinner,
  useTheme,
  Datepicker,
  Select,
  SelectItem,
  IndexPath,
} from '@ui-kitten/components';
import { NotificationBell } from '../../components/NotificationBell';
import { selectLocale } from '../../redux/slices/appSlice';
import { useAppSelector } from '../../redux/hooks';
import { i18n } from '../../i18n';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterChip } from '../../components/FilterChip';
import { StudentCard } from '../../components/StudentCard';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { EmptyState } from '../../components/EmptyState';
import { YInput } from '../../components/YInput';
import { User, UserRole, FeeFrequency } from '../../types';
import UserService from '../../services/UserService';
import { spacing, borderRadius } from '../../theme';


type FeeFilter = 'all' | 'paid' | 'pending' | 'overdue';

const FEE_FILTERS = [
  { label: 'all', getLabel: () => i18n.t('all') },
  { label: 'paid', getLabel: () => i18n.t('fee_paid') },
  { label: 'pending', getLabel: () => i18n.t('fee_pending') },
  { label: 'overdue', getLabel: () => i18n.t('fee_overdue') },
];

export const StudentsScreen = ({ navigation, isTabMode = false, triggerAdd = 0 }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((state: any) => state.auth.user);
  const locale = useAppSelector(selectLocale); // Listen for language changes

  const [students, setStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FeeFilter>('all');
  const [filters] = useState(FEE_FILTERS);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form Modal State
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Academic Info
  const [formCourseName, setFormCourseName] = useState('');
  const [formCourseDuration, setFormCourseDuration] = useState('');
  const [formCourseStartDate, setFormCourseStartDate] = useState(new Date());

  // Fee Info
  const [formTotalFees, setFormTotalFees] = useState('');
  const [formFeeFrequencyIndex, setFormFeeFrequencyIndex] = useState<IndexPath | IndexPath[]>(new IndexPath(0));
  const [formFeeAmountPerCycle, setFormFeeAmountPerCycle] = useState('');
  const [formNextPaymentDue, setFormNextPaymentDue] = useState(new Date());

  const feeFrequencies = Object.values(FeeFrequency);
  const selectedFeeFrequency = feeFrequencies[(formFeeFrequencyIndex as IndexPath).row];

  useEffect(() => {
    if (triggerAdd > 0) {
      handleAddStudent();
    }
  }, [triggerAdd]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data } = await UserService.getStudents();
      setStudents(data);
    } catch (error: any) {
      console.error('Failed to fetch students', error);
      Alert.alert(i18n.t('error'), i18n.t('err_load_students', { defaultValue: 'Failed to load students' }));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddStudent = () => {
    setIsEditing(false);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setShowPassword(false);
    setFormCourseName('');
    setFormCourseDuration('');
    setFormCourseStartDate(new Date());
    setFormTotalFees('');
    setFormFeeFrequencyIndex(new IndexPath(0));
    setFormFeeAmountPerCycle('');
    setFormNextPaymentDue(new Date());
    setFieldErrors({});
    setFormModalVisible(true);
  };

  const handleEditStudent = (student: User) => {
    setIsEditing(true);
    setFormName(student.name);
    setFormEmail(student.email);
    setFormPhone(student.phone || '');
    setFormPassword('');
    setShowPassword(false);
    
    // Academic Info
    setFormCourseName(student.course?.name || '');
    setFormCourseDuration(student.course?.duration || '');
    setFormCourseStartDate(student.course?.startDate ? new Date(student.course.startDate) : new Date());

    // Fee Info
    setFormTotalFees(student.totalFees?.toString() || '');
    const freqIndex = feeFrequencies.indexOf(student.feeFrequency as FeeFrequency);
    setFormFeeFrequencyIndex(new IndexPath(freqIndex >= 0 ? freqIndex : 0));
    setFormFeeAmountPerCycle(student.feeAmountPerCycle?.toString() || '');
    setFormNextPaymentDue(student.nextPaymentDue ? new Date(student.nextPaymentDue) : new Date());

    setFieldErrors({});
    setFormModalVisible(true);
    setModalVisible(false); // Close details modal
  };

  const handleSaveStudent = async () => {
    setFieldErrors({});
    if (!formName.trim() || !formEmail.trim() || (!isEditing && !formPassword.trim()) || !formCourseName.trim() || !formCourseDuration.trim() || !formTotalFees || !formFeeAmountPerCycle) {
      Alert.alert(i18n.t('error'), i18n.t('err_fill_required'));
      return;
    }

    setIsSaving(true);
    try {
      const studentData: any = {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        course: {
          name: formCourseName.trim(),
          duration: formCourseDuration.trim(),
          startDate: formCourseStartDate.toISOString(),
        },
        totalFees: parseFloat(formTotalFees),
        feeFrequency: selectedFeeFrequency,
        feeAmountPerCycle: parseFloat(formFeeAmountPerCycle),
        nextPaymentDue: formNextPaymentDue.toISOString(),
      };

      if (!isEditing) {
        studentData.password = formPassword;
      }

      if (isEditing && selectedStudent) {
        await UserService.updateStudent(selectedStudent._id, studentData);
        Alert.alert(i18n.t('success'), i18n.t('msg_student_updated'));
      } else {
        await UserService.createStudent(studentData);
        Alert.alert(i18n.t('success'), i18n.t('msg_student_created'));
      }

      setFormModalVisible(false);
      fetchStudents();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.error?.details) {
        setFieldErrors(err.response.data.error.details);
      } else {
        Alert.alert(i18n.t('error'), err.response?.data?.error?.message || err.message || i18n.t('error'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone?.includes(searchQuery);

    // Fee status filter
    let matchesFilter = true;
    if (selectedFilter === 'paid') {
      matchesFilter = (student.feesPaid || 0) >= (student.totalFees || 0);
    } else if (selectedFilter === 'pending') {
      matchesFilter = (student.feesPaid || 0) < (student.totalFees || 0);
    } else if (selectedFilter === 'overdue') {
      matchesFilter =
        student.nextPaymentDue !== undefined &&
        new Date(student.nextPaymentDue).getTime() < new Date().getTime();
    }

    return matchesSearch && matchesFilter;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudents();
  }, []);

  const handleStudentPress = (student: User) => {
    setSelectedStudent(student);
    setModalVisible(true);
  };

  const renderStudent = ({ item }: { item: User }) => (
    <StudentCard student={item} onPress={() => handleStudentPress(item)} />
  );

  return (
    <Layout style={[styles.container, !isTabMode && { paddingTop: insets.top }]}>
      {/* Header */}
      {!isTabMode && (
        <View style={styles.header}>
          <View>
            <Text category="h5" style={{ fontWeight: '700' }}>
              {i18n.t('students_title')}
            </Text>
            <Text category="c1" appearance="hint">
              {`${students.length} ${i18n.t('total', { defaultValue: 'total' })}`}
            </Text>
          </View>
          <NotificationBell />
        </View>
      )}
      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder={i18n.t('students_search', { defaultValue: 'Search by name, email, or phone...' })}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessoryLeft={(props) => <Icon {...props} name="search-outline" />}
          style={styles.searchInput}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filters}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <FilterChip
              label={item.getLabel()}
              selected={selectedFilter === item.label}
              onPress={() => setSelectedFilter(item.label as FeeFilter)}
            />
          )}
          keyExtractor={(item) => item.label}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        />
      </View>

      {/* Students List */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme['color-primary-500']}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={i18n.t('no_data')}
            message={i18n.t('no_results')}
          />
        }
      />

      {/* Student Detail Modal */}
      <BottomSheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={i18n.t('student_details', { defaultValue: 'Student Details' })}
      >
        {selectedStudent && (
          <View style={styles.modalContent}>
            {/* ... (details rows) ... */}
            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                {i18n.t('label_name')}
              </Text>
              <Text category="s1" style={{ fontWeight: '600' }}>
                {selectedStudent.name}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                {i18n.t('label_email')}
              </Text>
              <Text category="s1">{selectedStudent.email}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                {i18n.t('label_phone')}
              </Text>
              <Text category="s1">{selectedStudent.phone || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                {i18n.t('label_course')}
              </Text>
              <Text category="s1">
                {selectedStudent.course?.name || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                {i18n.t('label_duration')}
              </Text>
              <Text category="s1">
                {selectedStudent.course?.duration || 'N/A'}
              </Text>
            </View>

            <View style={styles.feeSection}>
              <Text category="s1" style={{ fontWeight: '600', marginBottom: spacing.md }}>
                {i18n.t('fee_details')}
              </Text>
              
              <View style={styles.feeRow}>
                <Text category="c1" appearance="hint">
                  {i18n.t('total_fees')}
                </Text>
                <Text category="s1" style={{ fontWeight: '600' }}>
                  ₹{selectedStudent.totalFees?.toLocaleString() || 0}
                </Text>
              </View>

              <View style={styles.feeRow}>
                <Text category="c1" appearance="hint">
                  {i18n.t('fees_paid')}
                </Text>
                <Text category="s1" status="success" style={{ fontWeight: '600' }}>
                  ₹{selectedStudent.feesPaid?.toLocaleString() || 0}
                </Text>
              </View>

              <View style={styles.feeRow}>
                <Text category="c1" appearance="hint">
                  {i18n.t('fees_remaining')}
                </Text>
                <Text
                  category="s1"
                  status={(selectedStudent.totalFees || 0) - (selectedStudent.feesPaid || 0) > 0 ? 'danger' : 'success'}
                  style={{ fontWeight: '600' }}
                >
                  ₹{((selectedStudent.totalFees || 0) - (selectedStudent.feesPaid || 0)).toLocaleString()}
                </Text>
              </View>

              {selectedStudent.nextPaymentDue && (
                <View style={styles.feeRow}>
                  <Text category="c1" appearance="hint">
                    {i18n.t('label_next_due_date')}
                  </Text>
                  <Text category="s1">
                    {new Date(selectedStudent.nextPaymentDue).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
              <Button style={{ flex: 1 }} onPress={() => handleEditStudent(selectedStudent)}>
                {i18n.t('action_edit')}
              </Button>
              <Button style={{ flex: 1 }} status="danger" appearance="outline" onPress={() => { 
                Alert.alert(i18n.t('confirm_delete'), i18n.t('msg_confirm_delete_student'), [
                  { text: i18n.t('cancel'), style: 'cancel' },
                  { text: i18n.t('delete'), style: 'destructive', onPress: async () => { 
                      try { await UserService.deleteStudent(selectedStudent._id); setModalVisible(false); fetchStudents(); } 
                      catch (err: any) { Alert.alert(i18n.t('error'), i18n.t('err_delete_student')); } 
                  }}
                ]); 
              }}>
                {i18n.t('action_delete')}
              </Button>
            </View>
          </View>
        )}
      </BottomSheetModal>

      {/* Student Form Modal (Add/Edit) */}
      <BottomSheetModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        title={isEditing ? i18n.t('title_edit_student') : i18n.t('title_add_student')}
      >
        <View style={styles.modalContent}>
            <Text category="s1" style={styles.sectionHeader}>{i18n.t('personal_info', { defaultValue: 'Personal Information' })}</Text>
            <YInput
              label={i18n.t('label_name')}
              placeholder={i18n.t('placeholder_fullname')}
              value={formName}
              onChangeText={setFormName}
              style={{ marginBottom: spacing.md }}
              status={fieldErrors.name ? 'danger' : 'basic'}
              caption={fieldErrors.name}
            />

            <YInput
              label={i18n.t('label_email')}
              placeholder={i18n.t('placeholder_email')}
              value={formEmail}
              onChangeText={setFormEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ marginBottom: spacing.md }}
              status={fieldErrors.email ? 'danger' : 'basic'}
              caption={fieldErrors.email}
            />

            <YInput
              label={i18n.t('label_phone')}
              placeholder={i18n.t('placeholder_phone')}
              value={formPhone}
              onChangeText={setFormPhone}
              keyboardType="phone-pad"
              style={{ marginBottom: spacing.md }}
              status={fieldErrors.phone ? 'danger' : 'basic'}
              caption={fieldErrors.phone}
            />

            {!isEditing && (
              <YInput
                label={i18n.t('password')}
                placeholder={i18n.t('placeholder_temp_password')}
                value={formPassword}
                onChangeText={setFormPassword}
                secureTextEntry={!showPassword}
                style={{ marginBottom: spacing.lg }}
                status={fieldErrors.password ? 'danger' : 'basic'}
                caption={fieldErrors.password}
                accessoryRight={(props) => (
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon {...props} name={showPassword ? 'eye-outline' : 'eye-off-outline'} />
                  </TouchableOpacity>
                )}
              />
            )}

            <Text category="s1" style={[styles.sectionHeader, { marginTop: spacing.md }]}>{i18n.t('academic_info', { defaultValue: 'Academic Information' })}</Text>
            <YInput
              label={i18n.t('label_course')}
              placeholder={i18n.t('placeholder_course_name', { defaultValue: 'e.g. Spoken English' })}
              value={formCourseName}
              onChangeText={setFormCourseName}
              style={{ marginBottom: spacing.md }}
              status={fieldErrors['course.name'] ? 'danger' : 'basic'}
              caption={fieldErrors['course.name']}
            />

            <YInput
              label={i18n.t('label_duration')}
              placeholder={i18n.t('placeholder_duration', { defaultValue: 'e.g. 6 Months' })}
              value={formCourseDuration}
              onChangeText={setFormCourseDuration}
              style={{ marginBottom: spacing.md }}
              status={fieldErrors['course.duration'] ? 'danger' : 'basic'}
              caption={fieldErrors['course.duration']}
            />

            <View style={{ marginBottom: spacing.md }}>
              <Text category="label" style={{ marginBottom: spacing.xs }}>{i18n.t('label_start_date', { defaultValue: 'Start Date' })}</Text>
              <Datepicker
                date={formCourseStartDate}
                onSelect={setFormCourseStartDate}
                status={fieldErrors['course.startDate'] ? 'danger' : 'basic'}
                caption={fieldErrors['course.startDate']}
              />
            </View>

            <Text category="s1" style={[styles.sectionHeader, { marginTop: spacing.md }]}>{i18n.t('fee_details')}</Text>
            <YInput
              label={i18n.t('total_fees')}
              placeholder="0.00"
              value={formTotalFees}
              onChangeText={setFormTotalFees}
              keyboardType="numeric"
              style={{ marginBottom: spacing.md }}
              status={fieldErrors.totalFees ? 'danger' : 'basic'}
              caption={fieldErrors.totalFees}
            />

            <View style={{ marginBottom: spacing.md }}>
              <Text category="label" style={{ marginBottom: spacing.xs }}>{i18n.t('label_fee_frequency', { defaultValue: 'Fee Frequency' })}</Text>
              <Select
                selectedIndex={formFeeFrequencyIndex}
                onSelect={setFormFeeFrequencyIndex}
                value={selectedFeeFrequency.toUpperCase()}
                status={fieldErrors.feeFrequency ? 'danger' : 'basic'}
                caption={fieldErrors.feeFrequency}
              >
                {feeFrequencies.map((freq) => (
                  <SelectItem key={freq} title={freq.toUpperCase()} />
                ))}
              </Select>
            </View>

            <YInput
              label={i18n.t('label_fee_per_cycle', { defaultValue: 'Amount Per Cycle' })}
              placeholder="0.00"
              value={formFeeAmountPerCycle}
              onChangeText={setFormFeeAmountPerCycle}
              keyboardType="numeric"
              style={{ marginBottom: spacing.md }}
              status={fieldErrors.feeAmountPerCycle ? 'danger' : 'basic'}
              caption={fieldErrors.feeAmountPerCycle}
            />

            <View style={{ marginBottom: spacing.lg }}>
              <Text category="label" style={{ marginBottom: spacing.xs }}>{i18n.t('label_next_due_date')}</Text>
              <Datepicker
                date={formNextPaymentDue}
                onSelect={setFormNextPaymentDue}
                status={fieldErrors.nextPaymentDue ? 'danger' : 'basic'}
                caption={fieldErrors.nextPaymentDue}
              />
            </View>

            <Button
              style={styles.saveButton}
              onPress={handleSaveStudent}
              disabled={isSaving}
              accessoryLeft={isSaving ? () => <Spinner size="small" status="control" /> : undefined}
            >
              {isSaving ? '' : (isEditing ? i18n.t('action_update_student') : i18n.t('action_create_student'))}
            </Button>
          </View>
      </BottomSheetModal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    borderRadius: borderRadius.xl,
    borderWidth: 0,
  },
  filterContainer: {
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  modalContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing['8xl'], // Extra padding at bottom for keyboard/safety
  },
  sectionHeader: {
    fontWeight: '700',
    marginBottom: spacing.md,
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  detailRow: {
    marginBottom: spacing.lg,
  },
  feeSection: {
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
  },
});
