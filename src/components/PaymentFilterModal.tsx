import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Layout, Text, Button, Icon, Modal, Select, SelectItem, useTheme, IndexPath } from '@ui-kitten/components';
import { FilterChip } from './FilterChip';
import { i18n } from '../i18n';

interface PaymentFilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaymentFilterModal = ({ visible, onClose }: PaymentFilterModalProps) => {
  const theme = useTheme();
  const [selectedStyle, setSelectedStyle] = React.useState('Cozy');
  const [selectedSeason, setSelectedSeason] = React.useState('Spring');
  const [selectedWeather, setSelectedWeather] = React.useState('Sunny');
  const [eventIndex, setEventIndex] = React.useState<IndexPath | IndexPath[]>(new IndexPath(0));

  // Render icons stably
  const renderWeatherIcon = (name: string) => (props: any) => (
      <Icon {...props} name={name} />
  );

  return (
      <Modal
        visible={visible}
        backdropStyle={styles.backdrop}
        onBackdropPress={onClose}
        style={styles.modal}
      >
        <Layout style={styles.modalContainer}>
            <View style={styles.modalHeader}>
                <Button appearance='ghost' accessoryLeft={<Icon name='arrow-back'/>} onPress={onClose}/>
                <Text category='h6'>{i18n.t('filter', { defaultValue: 'Filters' })}</Text>
                <Button appearance='ghost' onPress={() => {}}>{i18n.t('filter_reset', { defaultValue: 'Reset' })}</Button>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                
                {/* Style Section */}
                <Text category='s1' style={styles.sectionTitle}>Style:</Text>
                <View style={styles.chipRow}>
                    {['Basic', 'Classic', 'Sporty', 'Glamorous', 'Cozy', 'Misty'].map(style => (
                        <FilterChip 
                            key={style} 
                            label={style} 
                            selected={selectedStyle === style} 
                            onPress={() => setSelectedStyle(style)}
                        />
                    ))}
                </View>

                {/* Event Section */}
                <Text category='s1' style={styles.sectionTitle}>Event:</Text>
                <Select
                    selectedIndex={eventIndex}
                    onSelect={index => setEventIndex(index)}
                    value='Select event type'
                    style={styles.select}
                >
                    <SelectItem title='Wedding' />
                    <SelectItem title='Party' />
                    <SelectItem title='Casual' />
                </Select>

                {/* Season Section */}
                <Text category='s1' style={styles.sectionTitle}>Season:</Text>
                <View style={styles.seasonRow}>
                    {['Spring', 'Summer', 'Autumn', 'Winter'].map(season => {
                        const isSelected = selectedSeason === season;
                        const icon = season === 'Spring' ? 'flower-outline' 
                                   : season === 'Summer' ? 'sunny-outline'
                                   : season === 'Autumn' ? 'umbrella-outline'
                                   : 'thermometer-outline'; 
                        
                        return (
                            <TouchableOpacity 
                                key={season}
                                onPress={() => setSelectedSeason(season)}
                                style={[
                                    styles.seasonCard,
                                    { 
                                        backgroundColor: isSelected ? '#1976D2' : '#FFFFFF',
                                        borderColor: isSelected ? '#1976D2' : '#E0E0E0'
                                    }
                                ]}
                            >
                                <Icon 
                                    name={icon} 
                                    fill={isSelected ? '#FFF' : '#000'} 
                                    style={{ width: 24, height: 24, marginBottom: 8 }}
                                />
                                <Text category='c2' style={{ color: isSelected ? '#FFF' : '#000' }}>{season}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Weather Section */}
                <Text category='s1' style={styles.sectionTitle}>Weather:</Text>
                <View style={styles.chipRow}>
                    {['Sunny', 'Cloudy', 'Rainy', 'Thunderstorms', 'Windy', 'Foggy'].map(weather => {
                         const iconName = weather === 'Sunny' ? 'sunny-outline' : 'cloud-outline'; 
                         return (
                            <FilterChip 
                                key={weather} 
                                label={weather} 
                                selected={selectedWeather === weather} 
                                // Pass the function directly, FilterChip will render it
                                icon={renderWeatherIcon(iconName)}
                                onPress={() => setSelectedWeather(weather)}
                            />
                         );
                    })}
                </View>

                {/* Temperature Section */}
                <Text category='s1' style={styles.sectionTitle}>Temperature:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                    <Text appearance='hint'>{i18n.t('filter_from', { defaultValue: 'From ' })}</Text>
                    <View style={styles.tempChip}><Text>16°C</Text></View>
                    <Text appearance='hint' style={{ marginHorizontal: 8 }}>{i18n.t('filter_to', { defaultValue: ' To ' })}</Text>
                    <View style={styles.tempChip}><Text>22°C</Text></View>
                </View>
                {/* Visual Fake Slider */}
                <View style={{ height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, marginBottom: 32 }}>
                    <View style={{ width: '30%', height: '100%', backgroundColor: '#2196F3', marginLeft: '20%' }} />
                    <View style={{ position: 'absolute', left: '20%', top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#2196F3', borderWidth: 2, borderColor: '#FFF' }} />
                    <View style={{ position: 'absolute', left: '50%', top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#2196F3', borderWidth: 2, borderColor: '#FFF' }} />
                </View>


            </ScrollView>

            <View style={styles.modalFooter}>
                 <Button style={[styles.applyButton, { backgroundColor: theme['color-primary-500'], borderColor: theme['color-primary-500'] }]} onPress={onClose}>
                     {evaProps => <Text {...evaProps} style={{ color: '#1A1A1A' }}>{i18n.t('filter_apply', { defaultValue: 'Apply filters' })}</Text>}
                 </Button>
            </View>
        </Layout>
      </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modal: {
      width: '100%',
      // Use fixed height or constrained flex to avoid measurement loops
      height: '90%',
      position: 'absolute',
      bottom: 0,
      justifyContent: 'flex-end',
      margin: 0, // Ensure no margin affects positioning
  },
  modalContainer: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      width: '100%' // Ensure full width
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24
  },
  modalContent: {
      paddingBottom: 80
  },
  sectionTitle: {
      marginBottom: 12,
      marginTop: 8
  },
  chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16
  },
  select: {
      marginBottom: 24
  },
  seasonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24
  },
  seasonCard: {
      width: '23%',
      aspectRatio: 1,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
  },
  tempChip: {
      backgroundColor: '#F0F0F0',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20
  },
  modalFooter: {
      position: 'absolute',
      bottom: 24,
      left: 24,
      right: 24
  },
  applyButton: {
      borderRadius: 30
  }
});
