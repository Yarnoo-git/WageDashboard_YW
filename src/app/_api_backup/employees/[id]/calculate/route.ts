import { NextRequest, NextResponse } from 'next/server'
import { calculateEmployeeSalary, updateEmployee, getAISettings } from '@/services/employeeDataService'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { 
      baseUpPercentage,
      meritIncreasePercentage,
      applyCalculation = false 
    } = body

    // AI 설정 가져오기 (기본값)
    const aiSettings = await getAISettings()
    const baseUp = baseUpPercentage ?? aiSettings?.baseUpPercentage ?? 3.2
    const merit = meritIncreasePercentage ?? aiSettings?.meritIncreasePercentage ?? 2.5

    // 급여 계산
    const calculation = await calculateEmployeeSalary(params.id, baseUp, merit)
    
    if (!calculation) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // 계산 결과
    const result = {
      employeeId: params.id,
      calculationDate: new Date().toISOString(),
      baseUpPercentage: baseUp,
      meritIncreasePercentage: merit,
      totalPercentage: baseUp + merit,
      suggestedSalary: calculation.suggestedSalary,
      status: applyCalculation ? 'applied' : 'draft',
      currentSalary: calculation.currentSalary,
      baseUpAmount: calculation.baseUpAmount,
      meritAmount: calculation.meritAmount,
      totalIncreaseAmount: calculation.suggestedSalary - calculation.currentSalary,
    }

    // 적용하는 경우
    if (applyCalculation) {
      await updateEmployee(params.id, {
        currentSalary: calculation.suggestedSalary
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Wage Calculation API Error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate wage' },
      { status: 500 }
    )
  }
}