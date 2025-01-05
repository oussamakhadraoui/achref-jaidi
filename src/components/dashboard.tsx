import React, { useState, useCallback } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Upload } from 'lucide-react'
import Papa from 'papaparse'
import _ from 'lodash'
import PredictiveAnalytics from './predict'

interface EquipmentData {
  equipment_id: string
  temperature: number
  vibration_level: number
  operating_hours: number
  pressure: number
  maintenance_required: string
  timestamp: string
  part_id: string
  part_name: string
  unit_name: string
  wear_cause: string
  part_health_percentage: number
  days_until_replacement: number
  last_maintenance_date: string
}

interface LatestReadings {
  [key: string]: EquipmentData
}

const EquipmentDashboard: React.FC = () => {
  const [data, setData] = useState<EquipmentData[]>([])
  const [latestReadings, setLatestReadings] = useState<LatestReadings>({})
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<EquipmentData[]>(
    []
  )
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Prepare data for charts by grouping by timestamp and equipment
  const prepareChartData = (data: EquipmentData[]) => {
    // Group data by timestamp first
    const groupedByTimestamp = _.groupBy(data, 'timestamp')

    // Convert to format needed for charts
    return Object.entries(groupedByTimestamp).map(([timestamp, readings]) => {
     const point = { timestamp }
    
     readings.forEach((reading) => {
       // @ts-expect-error dfgdfg
       point[`temp_${reading.equipment_id}`] = reading.temperature
       // @ts-expect-error dfgdfg
        point[`vib_${reading.equipment_id}`] = reading.vibration_level
      })
      return point
    })
  }

  const processData = (parsedData: EquipmentData[]) => {
    try {
      const latest: LatestReadings = {}
      const alerts: EquipmentData[] = []

      parsedData.forEach((row: EquipmentData) => {
        if (!row.equipment_id || !row.timestamp) return

        if (
          !latest[row.equipment_id] ||
          new Date(row.timestamp) > new Date(latest[row.equipment_id].timestamp)
        ) {
          latest[row.equipment_id] = row
        }
        if (row.maintenance_required === 'Yes') {
          alerts.push(row)
        }
      })

      setLatestReadings(latest)
      setMaintenanceAlerts(alerts)
      setData(parsedData)
      setError(null)
    } catch (err) {
      setError('Error processing data. Please check the file format.')
      console.error('Error processing data:', err)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)

    const file = e.dataTransfer.files[0]
    if (!file) {
      setError('No file provided')
      return
    }

    if (file.type !== 'text/csv') {
      setError('Please upload a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (!event.target?.result) {
        setError('Error reading file')
        return
      }

      const csvData = event.target.result as string
      const parseResult = Papa.parse<EquipmentData>(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transform: (value) => {
          if (value.trim) {
            return value.trim()
          }
          return value
        },
        transformHeader: (header) => {
          return header.trim().toLowerCase()
        },
      })

      if (parseResult.errors.length > 0) {
        setError('Error parsing CSV file')
        console.error('Parse errors:', parseResult.errors)
        return
      }

      processData(parseResult.data)
    }

    reader.onerror = () => {
      setError('Error reading file')
    }

    reader.readAsText(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // Get unique equipment IDs
  const equipmentIds = Array.from(new Set(data.map((d) => d.equipment_id)))

  // Prepare chart data
  const chartData = prepareChartData(data)

  if (data.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50 p-4'>
        <div
          className={`w-full max-w-2xl p-12 rounded-lg border-2 border-dashed transition-colors duration-200 ease-in-out
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className='flex flex-col items-center justify-center space-y-4 text-center'>
            <Upload className='w-12 h-12 text-gray-400' />
            <div className='space-y-2'>
              <h3 className='text-xl font-semibold'>Drop your CSV file here</h3>
              <p className='text-sm text-gray-500'>
                Drop your equipment monitoring CSV file to visualize the data
              </p>
              {error && <p className='text-sm text-red-500 mt-2'>{error}</p>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 space-y-6 bg-gray-50 min-h-screen'>
      <div className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold'>Equipment Monitoring Dashboard</h1>
        <div
          className={`p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors duration-200
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-500'
            }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className='w-6 h-6 text-gray-400' />
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Alerts Section */}
      {maintenanceAlerts.length > 0 && (
        <div className='mb-6'>
          <h2 className='text-xl font-semibold mb-3'>Maintenance Alerts</h2>
          <div className='space-y-2'>
            {maintenanceAlerts.map((alert, index) => (
              <Alert
                key={`${alert.equipment_id}-${index}`}
                variant='destructive'
              >
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  {alert.part_name} on {alert.unit_name} requires maintenance!
                  Health: {alert.part_health_percentage}% Days until
                  replacement: {alert.days_until_replacement}
                  Cause: {alert.wear_cause}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        {Object.values(latestReadings).map((reading) => (
          <Card key={reading.equipment_id}>
            <CardHeader>
              <CardTitle>{reading.part_name}</CardTitle>
              <CardDescription>{reading.unit_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <p>Temperature: {reading.temperature?.toFixed(1)}°C</p>
                <p>Vibration: {reading.vibration_level?.toFixed(2)}</p>
                <p>Pressure: {reading.pressure?.toFixed(1)} PSI</p>
                <p>Operating Hours: {reading.operating_hours}</p>
                <p>Health: {reading.part_health_percentage}%</p>
                <p>Days Until Replacement: {reading.days_until_replacement}</p>
                <p>Wear Cause: {reading.wear_cause}</p>
                <p
                  className={
                    reading.maintenance_required === 'Yes'
                      ? 'text-red-500'
                      : 'text-green-500'
                  }
                >
                  Status:{' '}
                  {reading.maintenance_required === 'Yes'
                    ? 'Maintenance Required'
                    : 'Normal'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Temperature Chart */}
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Temperature Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-96'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='timestamp'
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor='end'
                  height={70}
                />
                <YAxis
                  label={{
                    value: 'Temperature (°C)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip />
                <Legend />
                {equipmentIds.map((equipId, index) => (
                  <Line
                    key={equipId}
                    type='monotone'
                    dataKey={`temp_${equipId}`}
                    name={`Equipment ${equipId}`}
                    stroke={`hsl(${index * 120}, 70%, 50%)`}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Vibration Chart */}
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Vibration Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-96'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='timestamp'
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor='end'
                  height={70}
                />
                <YAxis
                  label={{
                    value: 'Vibration Level',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip />
                <Legend />
                {equipmentIds.map((equipId, index) => (
                  <Bar
                    key={equipId}
                    dataKey={`vib_${equipId}`}
                    name={`Equipment ${equipId}`}
                    fill={`hsl(${index * 120}, 70%, 50%)`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <PredictiveAnalytics data={data} />
    </div>
  )
}

export default EquipmentDashboard
