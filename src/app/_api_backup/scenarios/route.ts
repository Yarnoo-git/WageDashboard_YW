import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { Scenario } from '@/types/scenario'
import { getDashboardData } from '@/services/employeeDataService'

const SCENARIOS_DIR = path.join(process.cwd(), 'data', 'scenarios')
const SCENARIOS_FILE = path.join(SCENARIOS_DIR, 'scenarios.json')

// 파일 ID별 시나리오 파일 경로 생성
function getScenariosFilePath(fileId?: string): string {
  if (fileId) {
    return path.join(SCENARIOS_DIR, `scenarios_${fileId}.json`)
  }
  // 기본 경로 (레거시 지원)
  return SCENARIOS_FILE
}

// AI 설정을 가져오는 함수
async function getAISettings(): Promise<{ baseUpPercentage: number, meritIncreasePercentage: number }> {
  try {
    // 대시보드 데이터에서 AI 설정 직접 가져오기
    const dashboardData = await getDashboardData()
    
    if (dashboardData?.aiRecommendation) {
      return {
        baseUpPercentage: dashboardData.aiRecommendation.baseUpPercentage || 0,
        meritIncreasePercentage: dashboardData.aiRecommendation.meritIncreasePercentage || 0
      }
    }
  } catch (error) {
    console.error('Failed to read AI settings:', error)
  }
  
  // 기본값 반환 (엑셀 파일이 없을 경우)
  return {
    baseUpPercentage: 0,
    meritIncreasePercentage: 0
  }
}

// 기본 시나리오 생성 함수 - AI 설정을 파라미터로 받을 수 있도록 수정
async function createDefaultScenario(aiSettingsParam?: { baseUpPercentage: number, meritIncreasePercentage: number }): Promise<Scenario> {
  // 파라미터로 받은 AI 설정이 있으면 사용, 없으면 기존 방식 사용
  const aiSettings = aiSettingsParam || await getAISettings()
  const baseUp = aiSettings.baseUpPercentage
  const merit = aiSettings.meritIncreasePercentage
  const totalRate = baseUp + merit
  
  return {
    id: 'default',
    name: 'Default (AI 제안)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      baseUpRate: baseUp,
      meritRate: merit,
      levelRates: {
        'Lv.1': { baseUp, merit },
        'Lv.2': { baseUp, merit },
        'Lv.3': { baseUp, merit },
        'Lv.4': { baseUp, merit }
      },
      totalBudget: 0,
      promotionBudgets: { lv1: 0, lv2: 0, lv3: 0, lv4: 0 },
      additionalBudget: 0,
      enableAdditionalIncrease: false,
      calculatedAdditionalBudget: 0,
      levelTotalRates: {
        'Lv.1': totalRate,
        'Lv.2': totalRate,
        'Lv.3': totalRate,
        'Lv.4': totalRate
      },
      weightedAverageRate: totalRate,
      meritWeightedAverage: merit,
      detailedLevelRates: {
        'Lv.4': { baseUp, merit, promotion: 0, advancement: 0, additional: 0 },
        'Lv.3': { baseUp, merit, promotion: 0, advancement: 0, additional: 0 },
        'Lv.2': { baseUp, merit, promotion: 0, advancement: 0, additional: 0 },
        'Lv.1': { baseUp, merit, promotion: 0, advancement: 0, additional: 0 }
      }
    }
  }
}

interface ScenariosData {
  scenarios: Scenario[]
  activeScenarioId: string | null
}

async function ensureDirectoryExists() {
  try {
    await fs.mkdir(SCENARIOS_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create scenarios directory:', error)
  }
}

async function readScenarios(fileId?: string, aiSettings?: { baseUpPercentage: number, meritIncreasePercentage: number }): Promise<ScenariosData> {
  try {
    await ensureDirectoryExists()
    const filePath = getScenariosFilePath(fileId)
    const data = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(data)
    
    // 기본 시나리오가 없으면 추가
    const hasDefault = parsed.scenarios.some((s: Scenario) => s.id === 'default')
    if (!hasDefault) {
      const defaultScenario = await createDefaultScenario(aiSettings)
      parsed.scenarios.unshift(defaultScenario)
    } else {
      // 기본 시나리오가 있어도 AI 설정으로 업데이트
      const defaultScenario = await createDefaultScenario(aiSettings)
      parsed.scenarios = parsed.scenarios.map((s: Scenario) => 
        s.id === 'default' ? defaultScenario : s
      )
    }
    
    return parsed
  } catch (error) {
    // Return default data if file doesn't exist
    const defaultScenario = await createDefaultScenario(aiSettings)
    return {
      scenarios: [defaultScenario],
      activeScenarioId: null
    }
  }
}

async function writeScenarios(data: ScenariosData, fileId?: string): Promise<void> {
  await ensureDirectoryExists()
  const filePath = getScenariosFilePath(fileId)
  console.log('[writeScenarios] 파일 경로:', filePath)
  console.log('[writeScenarios] 시나리오 개수:', data.scenarios.length)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  console.log('[writeScenarios] 파일 저장 완료')
}

// GET /api/scenarios
export async function GET(request: NextRequest) {
  try {
    // URL 파라미터에서 fileId와 AI 설정 가져오기
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId') || undefined
    const baseUp = searchParams.get('baseUp')
    const merit = searchParams.get('merit')
    
    // AI 설정이 query parameter로 전달되면 사용
    const aiSettings = (baseUp !== null && merit !== null) ? {
      baseUpPercentage: parseFloat(baseUp) || 0,
      meritIncreasePercentage: parseFloat(merit) || 0
    } : undefined
    
    const data = await readScenarios(fileId, aiSettings)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to read scenarios:', error)
    return NextResponse.json({ error: 'Failed to read scenarios' }, { status: 500 })
  }
}

// POST /api/scenarios
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newScenario: Scenario = body.scenario || body
    const fileId = body.fileId
    console.log('[POST /api/scenarios] 새 시나리오 저장:', {
      id: newScenario.id,
      name: newScenario.name,
      usedBudget: newScenario.data.usedBudget,
      totalBudget: newScenario.data.totalBudget
    })
    
    const data = await readScenarios(fileId)
    
    // Default 시나리오는 항상 유지
    const defaultScenario = data.scenarios.find(s => s.id === 'default') || await createDefaultScenario()
    const nonDefaultScenarios = data.scenarios.filter(s => s.id !== 'default')
    
    // Add new scenario
    nonDefaultScenarios.push(newScenario)
    data.scenarios = [defaultScenario, ...nonDefaultScenarios]
    data.activeScenarioId = newScenario.id
    
    await writeScenarios(data, fileId)
    
    return NextResponse.json({ success: true, scenario: newScenario })
  } catch (error) {
    console.error('Failed to save scenario:', error)
    return NextResponse.json({ error: 'Failed to save scenario' }, { status: 500 })
  }
}

// PUT /api/scenarios
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { scenarios, activeScenarioId, fileId } = body
    
    const data: ScenariosData = {
      scenarios: scenarios || [],
      activeScenarioId: activeScenarioId || null
    }
    
    await writeScenarios(data, fileId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update scenarios:', error)
    return NextResponse.json({ error: 'Failed to update scenarios' }, { status: 500 })
  }
}

// DELETE /api/scenarios/[id]
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const fileId = url.searchParams.get('fileId') || undefined
    
    if (!id) {
      return NextResponse.json({ error: 'Scenario ID is required' }, { status: 400 })
    }
    
    // 기본 시나리오는 삭제 불가
    if (id === 'default') {
      return NextResponse.json({ error: 'Cannot delete default scenario' }, { status: 400 })
    }
    
    const data = await readScenarios(fileId)
    
    // Remove scenario (기본 시나리오 제외)
    data.scenarios = data.scenarios.filter(s => s.id !== id && s.id !== 'default')
    
    // Update active scenario if deleted
    if (data.activeScenarioId === id) {
      data.activeScenarioId = null
    }
    
    await writeScenarios(data, fileId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete scenario:', error)
    return NextResponse.json({ error: 'Failed to delete scenario' }, { status: 500 })
  }
}