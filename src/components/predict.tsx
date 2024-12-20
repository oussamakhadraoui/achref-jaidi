import { Alert, AlertDescription } from '@/components/ui/alert'
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle } from 'lucide-react'
import React from 'react'
import {
 Area,
 AreaChart,
 CartesianGrid,
 Legend,
 Line,
 ResponsiveContainer,
 Tooltip,
 XAxis,
 YAxis
} from 'recharts'

interface PredictiveData {
  equipment_id: string
  temperature: number
  vibration_level: number
  timestamp: string
}

const PredictiveAnalytics: React.FC<{ data: PredictiveData[] }> = ({
  data,
}) => {



  // Function to generate future timestamps
  const generateFutureTimestamps = (lastTimestamp: string, hours: number) => {
    const timestamps = []
    let currentDate = new Date(lastTimestamp)

    for (let i = 1; i <= hours; i++) {
      currentDate = new Date(currentDate.getTime() + 60 * 60 * 1000)
      timestamps.push(currentDate.toISOString().slice(0, 19).replace('T', ' '))
    }

    return timestamps
  }

  // Function to predict future values using simple linear regression
  const predictFutureValues = (equipment_id: string) => {
    const equipmentData = data.filter((d) => d.equipment_id === equipment_id)
    const temps = equipmentData.map((d) => d.temperature)
    const vibs = equipmentData.map((d) => d.vibration_level)

    // Calculate trends
    const tempTrend = (temps[temps.length - 1] - temps[0]) / temps.length
    const vibTrend = (vibs[vibs.length - 1] - vibs[0]) / vibs.length

    // Generate future timestamps
    const futureTimestamps = generateFutureTimestamps(
      equipmentData[equipmentData.length - 1].timestamp,
      6
    )

    // Generate predictions
    return futureTimestamps.map((timestamp, index) => ({
      timestamp,
      predictedTemp: temps[temps.length - 1] + tempTrend * (index + 1),
      predictedVib: vibs[vibs.length - 1] + vibTrend * (index + 1),
      upperBoundTemp: temps[temps.length - 1] + tempTrend * (index + 1) + 2,
      lowerBoundTemp: temps[temps.length - 1] + tempTrend * (index + 1) - 2,
      equipment_id,
    }))
  }

  // Calculate maintenance probability based on current trends
  const calculateMaintenanceProbability = (equipment_id: string) => {
    const equipmentData = data.filter((d) => d.equipment_id === equipment_id)
    const temps = equipmentData.map((d) => d.temperature)
    const vibs = equipmentData.map((d) => d.vibration_level)

    const tempTrend = (temps[temps.length - 1] - temps[0]) / temps.length
    const vibTrend = (vibs[vibs.length - 1] - vibs[0]) / vibs.length

    // Simple probability calculation based on trends
    const tempProb = Math.min(
      100,
      Math.max(0, (tempTrend * 20 + (temps[temps.length - 1] - 75) / 25) * 100)
    )
    const vibProb = Math.min(
      100,
      Math.max(0, (vibTrend * 30 + (vibs[vibs.length - 1] - 2) / 2) * 100)
    )

    return Math.round((tempProb + vibProb) / 2)
  }

  const uniqueEquipments = Array.from(new Set(data.map((d) => d.equipment_id)))

  return (
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold mb-4'>Predictive Analytics</h2>

      {/* Maintenance Probability Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        {uniqueEquipments.map((equipment_id) => {
          const probability = calculateMaintenanceProbability(equipment_id)
          return (
            <Card key={equipment_id}>
              <CardHeader>
                <CardTitle>Equipment {equipment_id}</CardTitle>
                <CardDescription>Maintenance Probability</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={probability} className='mb-2' />
                <p className='text-sm text-gray-500'>
                  {probability}% chance of requiring maintenance
                </p>
                {probability > 70 && (
                  <Alert variant='destructive' className='mt-2'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>
                      High risk of maintenance needed soon
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Forecast Charts */}
      {uniqueEquipments.map((equipment_id) => {
        const predictions = predictFutureValues(equipment_id)
        const historicalData = data.filter(
          (d) => d.equipment_id === equipment_id
        )
        const combinedData = [
          ...historicalData,
          ...predictions.map((p) => ({
            ...p,
            temperature: undefined,
            vibration_level: undefined,
            temperature_predicted: p.predictedTemp,
            vibration_predicted: p.predictedVib,
          })),
        ]

        return (
          <Card key={equipment_id} className='mb-6'>
            <CardHeader>
              <CardTitle>Equipment {equipment_id} - Forecast</CardTitle>
              <CardDescription>
                Next 6 hours prediction with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={combinedData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='timestamp'
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor='end'
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {/* Historical Data */}
                    <Line
                      type='monotone'
                      dataKey='temperature'
                      stroke='#8884d8'
                      name='Historical Temperature'
                      strokeWidth={2}
                    />
                    {/* Predicted Data */}
                    <Line
                      type='monotone'
                      dataKey='temperature_predicted'
                      stroke='#8884d8'
                      strokeDasharray='5 5'
                      name='Predicted Temperature'
                    />
                    {/* Confidence Intervals */}
                    <Area
                      type='monotone'
                      dataKey='upperBoundTemp'
                      stroke='none'
                      fill='#8884d8'
                      fillOpacity={0.1}
                      name='Upper Bound'
                    />
                    <Area
                      type='monotone'
                      dataKey='lowerBoundTemp'
                      stroke='none'
                      fill='#8884d8'
                      fillOpacity={0.1}
                      name='Lower Bound'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default PredictiveAnalytics
