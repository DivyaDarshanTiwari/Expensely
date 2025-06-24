import { View, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

export default function ChartSummary() {
  const data = {
    labels: ['Food', 'Travel', 'Utilities', 'Other'],
    datasets: [{ data: [50, 30, 20, 40] }]
  };
  return (
    <View>
      <BarChart
        data={data}
        width={Dimensions.get('window').width - 32}
        height={220}
        fromZero
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: () => '#000'
        }}
        style={{ marginVertical: 8, borderRadius: 8 }}
      />
    </View>
  );
}
