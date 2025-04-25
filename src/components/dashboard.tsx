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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  const [loading, setLoading] = useState<boolean>(false)

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
      setLoading(false) // Hide loading after processing
    } catch (err) {
      setError('Error processing data. Please check the file format.')
      setLoading(false)
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

    setLoading(true) // Start loading

    const reader = new FileReader()
    reader.onload = (event) => {
      if (!event.target?.result) {
        setError('Error reading file')
        setLoading(false)
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
        setLoading(false)
        console.error('Parse errors:', parseResult.errors)
        return
      }

      // Mock loading: wait 1 second before processing data
      setTimeout(() => {
        processData(parseResult.data)
      }, 1000)
    }

    reader.onerror = () => {
      setError('Error reading file')
      setLoading(false)
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

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100 p-4'>
        <div className='flex flex-col items-center space-y-6'>
          <svg
            className='animate-spin h-16 w-16 text-indigo-500'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8v8z'
            ></path>
          </svg>
          <h2 className='text-2xl font-bold text-indigo-700'>
            Loading your data...
          </h2>
          <p className='text-slate-600'>
            Please wait while we process your CSV file.
          </p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100 p-4'>
        <div className='w-full max-w-2xl flex flex-col items-center'>
          {/* App Info Section */}
          <div className='flex flex-col items-center mb-10'>
            <div className='bg-indigo-100 rounded-full p-4 mb-4 shadow'>
              <svg width='48' height='48' viewBox='0 0 48 48' fill='none'>
                <rect width='48' height='48' rx='12' fill='#6366f1' />
                <path
                  d='M14 34V20M24 34V14M34 34V26'
                  stroke='#fff'
                  strokeWidth='3'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
            <h1 className='text-3xl font-extrabold text-indigo-700 mb-2'>
              Maintenance Dashboard
            </h1>
            <p className='text-lg text-slate-600 text-center max-w-xl'>
              Welcome to your smart equipment monitoring dashboard.
              <br />
              Upload your equipment CSV file to visualize real-time trends,
              receive predictive maintenance alerts, and gain actionable
              insights for proactive asset management.
            </p>
          </div>
          {/* Upload Card */}
          <div
            className={`w-full p-12 rounded-2xl border-2 border-dashed transition-colors duration-200 ease-in-out shadow-xl bg-white/90 flex flex-col items-center
              ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/80'
                  : 'border-slate-200'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className='w-16 h-16 text-indigo-400 mb-2' />
            <div className='space-y-2 text-center'>
              <h3 className='text-2xl font-bold text-indigo-700'>
                Drop your CSV file here
              </h3>
              <p className='text-base text-slate-500'>
                Drag and drop your equipment monitoring CSV file to visualize
                the data
              </p>
              {error && <p className='text-base text-red-500 mt-2'>{error}</p>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-8 space-y-10 bg-gradient-to-br from-blue-50 via-white to-gray-100 min-h-screen'>
      <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
        <h1 className='text-4xl font-extrabold text-primary drop-shadow-sm'>
          Equipment Monitoring Dashboard
        </h1>
        <div
          className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors duration-200 shadow hover:shadow-lg
            ${
              isDragging
                ? 'border-blue-500 bg-blue-100/80'
                : 'border-gray-300 hover:border-blue-500 bg-white'
            }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className='w-7 h-7 text-blue-400' />
        </div>
      </div>

      {error && (
        <Alert variant='destructive' className='shadow-lg'>
          <AlertCircle className='h-5 w-5' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Alerts Section */}
      {maintenanceAlerts.length > 0 && (
        <div className='mb-8'>
          <h2 className='text-2xl font-bold mb-4 text-red-600'>
            Maintenance Alerts
          </h2>
          <div className='space-y-3'>
            {maintenanceAlerts.map((alert, index) => (
              <Alert
                key={`${alert.equipment_id}-${index}`}
                variant='destructive'
                className='shadow'
              >
                <AlertCircle className='h-5 w-5' />
                <AlertDescription>
                  <span className='font-semibold'>{alert.part_name}</span> on{' '}
                  <span className='font-semibold'>{alert.unit_name}</span>{' '}
                  requires maintenance!
                  <span className='ml-2'>
                    Health:{' '}
                    <span className='font-bold'>
                      {alert.part_health_percentage}%
                    </span>
                  </span>
                  <span className='ml-2'>
                    Days until replacement:{' '}
                    <span className='font-bold'>
                      {alert.days_until_replacement}
                    </span>
                  </span>
                  <span className='ml-2'>
                    Cause: <span className='font-bold'>{alert.wear_cause}</span>
                  </span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {Object.values(latestReadings).map((reading) => (
          <Card
            key={reading.equipment_id}
            className='hover:scale-[1.025] transition-transform duration-200'
          >
            <CardHeader>
              <CardTitle>{reading.part_name}</CardTitle>
              <CardDescription>{reading.unit_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-base'>
                <p>
                  <span className='font-medium text-gray-700'>
                    Temperature:
                  </span>{' '}
                  <span className='font-bold'>
                    {reading.temperature?.toFixed(1)}°C
                  </span>
                </p>
                <p>
                  <span className='font-medium text-gray-700'>Vibration:</span>{' '}
                  <span className='font-bold'>
                    {reading.vibration_level?.toFixed(2)}
                  </span>
                </p>
                <p>
                  <span className='font-medium text-gray-700'>Pressure:</span>{' '}
                  <span className='font-bold'>
                    {reading.pressure?.toFixed(1)} PSI
                  </span>
                </p>
                <p>
                  <span className='font-medium text-gray-700'>
                    Operating Hours:
                  </span>{' '}
                  <span className='font-bold'>{reading.operating_hours}</span>
                </p>
                <p>
                  <span className='font-medium text-gray-700'>Health:</span>{' '}
                  <span className='font-bold'>
                    {reading.part_health_percentage}%
                  </span>
                </p>
                <p>
                  <span className='font-medium text-gray-700'>
                    Days Until Replacement:
                  </span>{' '}
                  <span className='font-bold'>
                    {reading.days_until_replacement}
                  </span>
                </p>
                <p>
                  <span className='font-medium text-gray-700'>Wear Cause:</span>{' '}
                  <span className='font-bold'>{reading.wear_cause}</span>
                </p>
                <p
                  className={
                    reading.maintenance_required === 'Yes'
                      ? 'text-red-600 font-semibold'
                      : 'text-green-600 font-semibold'
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
      <Card className='mb-8 shadow-xl'>
        <CardHeader>
          <CardTitle>Temperature Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-96 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl p-4 shadow-inner'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='timestamp'
                  tick={{ fontSize: 13, fill: '#555' }}
                  angle={-30}
                  textAnchor='end'
                  height={60}
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
      <Card className='mb-8 shadow-xl'>
        <CardHeader>
          <CardTitle>Vibration Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-96 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl p-4 shadow-inner'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='timestamp'
                  tick={{ fontSize: 13, fill: '#555' }}
                  angle={-30}
                  textAnchor='end'
                  height={60}
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
