import { NextRequest, NextResponse } from 'next/server'
import { searchEmployees } from '@/services/employeeDataService'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const level = searchParams.get('level') || undefined
    const department = searchParams.get('department') || undefined
    const search = searchParams.get('search') || undefined

    // employeeDataService의 검색 기능 사용
    const result = await searchEmployees({
      page,
      limit,
      level,
      department,
      search
    })

    // API 응답 형식에 맞게 변환
    const employees = result.employees.map(emp => ({
      id: emp.employeeId,
      employeeNumber: emp.employeeId,
      name: emp.name,
      department: emp.department,
      level: emp.level,
      currentSalary: emp.currentSalary,
      hireDate: emp.hireDate,
      performanceRating: emp.performanceRating || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wageCalculations: []
    }))

    // 응답 데이터 포맷
    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      employeeNumber: emp.employeeNumber,
      name: emp.name,
      department: emp.department,
      level: emp.level,
      currentSalary: emp.currentSalary,
      performanceRating: emp.performanceRating,
      hireDate: emp.hireDate,
      latestCalculation: null,
    }))

    return NextResponse.json({
      data: formattedEmployees,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('Employees API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}