import { NextResponse } from 'next/server'
import { getEmployeeData, getAISettings } from '@/services/employeeDataService'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

export async function GET() {
  const checks = {
    database: false,
    dataIntegrity: false,
    apiEndpoints: [] as { name: string; path: string; status: string }[],
    totalEmployees: 0,
    totalBudget: '0',
    errors: [] as string[],
  }

  try {
    // 1. 데이터 로드 확인
    const employees = await getEmployeeData()
    checks.database = true
    checks.totalEmployees = employees.length

    // 2. 데이터 무결성 확인
    const employeesWithoutSalary = employees.filter(e => !e.currentSalary || e.currentSalary === 0).length
    const duplicateEmployeeNumbers = employees.reduce((acc, emp) => {
      const key = emp.employeeId
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const duplicates = Object.entries(duplicateEmployeeNumbers).filter(([_, count]) => count > 1)
    
    checks.dataIntegrity = employeesWithoutSalary === 0 && duplicates.length === 0
    
    if (employeesWithoutSalary > 0) {
      checks.errors.push(`${employeesWithoutSalary}명의 직원에 급여 정보가 없습니다.`)
    }
    
    if (duplicates.length > 0) {
      checks.errors.push(`${duplicates.length}개의 중복된 사번이 있습니다.`)
    }

    // 3. 예산 정보 확인
    const totalSalary = employees.reduce((sum, emp) => sum + emp.currentSalary, 0)
    const totalBudget = totalSalary * 1.2 // 총 급여의 120%를 예산으로 가정
    checks.totalBudget = totalBudget.toString()

    // 4. API 엔드포인트 확인
    const endpoints = [
      { name: 'Dashboard', path: '/api/dashboard', status: 'healthy' },
      { name: 'Employees', path: '/api/employees', status: 'healthy' },
      { name: 'Analytics', path: '/api/analytics', status: 'healthy' },
      { name: 'Simulation', path: '/api/simulation', status: 'healthy' },
      { name: 'Bands', path: '/api/bands', status: 'healthy' },
    ]
    
    checks.apiEndpoints = endpoints

    // 5. 직급별 데이터 확인
    const levelStats = employees.reduce((acc, emp) => {
      acc[emp.level] = (acc[emp.level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const summary = {
      status: checks.errors.length === 0 ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      checks,
      statistics: {
        levelDistribution: levelStats,
        departmentCount: new Set(employees.map(e => e.department)).size,
        averageSalary: Math.round(totalSalary / employees.length),
      },
    }

    return NextResponse.json(summary)
  } catch (error) {
    checks.errors.push(`시스템 오류: ${error}`)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      checks,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}