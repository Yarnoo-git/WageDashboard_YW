import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeData, updateEmployee as updateEmployeeData } from '@/services/employeeDataService'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employees = await getEmployeeData()
    const employee = employees.find(emp => emp.employeeId === params.id)

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // 같은 직급의 평균 급여 계산
    const levelEmployees = employees.filter(e => e.level === employee.level)
    const levelAverage = levelEmployees.reduce((sum, e) => sum + e.currentSalary, 0) / levelEmployees.length

    // 같은 부서의 평균 급여 계산
    const deptEmployees = employees.filter(e => e.department === employee.department)
    const departmentAverage = deptEmployees.reduce((sum, e) => sum + e.currentSalary, 0) / deptEmployees.length

    const employeeData = {
      id: employee.employeeId,
      employeeNumber: employee.employeeId,
      name: employee.name,
      department: employee.department,
      level: employee.level,
      currentSalary: employee.currentSalary,
      hireDate: employee.hireDate,
      performanceRating: employee.performanceRating || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      salaryHistories: [],
      wageCalculations: [],
      levelAverage: Math.round(levelAverage),
      departmentAverage: Math.round(departmentAverage),
    }

    return NextResponse.json(employeeData)
  } catch (error) {
    console.error('Employee Detail API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { currentSalary, performanceRating } = body

    const updatedEmployee = await updateEmployeeData(params.id, {
      currentSalary: currentSalary || undefined,
      performanceRating: performanceRating || undefined,
    })

    if (!updatedEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: updatedEmployee.employeeId,
      employeeNumber: updatedEmployee.employeeId,
      name: updatedEmployee.name,
      department: updatedEmployee.department,
      level: updatedEmployee.level,
      currentSalary: updatedEmployee.currentSalary,
      hireDate: updatedEmployee.hireDate,
      performanceRating: updatedEmployee.performanceRating,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Employee Update API Error:', error)
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}