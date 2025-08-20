import { NextResponse } from 'next/server'
import { getEmployeeData } from '@/services/employeeDataService'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

export async function GET() {
  try {
    const currentYear = new Date().getFullYear()
    const employees = await getEmployeeData()

    // 1. 급여 분포 분석
    const salaryRanges = [
      { min: 0, max: 40000000, label: '4천만 미만' },
      { min: 40000000, max: 60000000, label: '4-6천만' },
      { min: 60000000, max: 80000000, label: '6-8천만' },
      { min: 80000000, max: 100000000, label: '8천만-1억' },
      { min: 100000000, max: 150000000, label: '1-1.5억' },
      { min: 150000000, max: Infinity, label: '1.5억 이상' },
    ]

    const salaryDistribution = salaryRanges.map(range => {
      const count = employees.filter(emp => {
        return emp.currentSalary >= range.min && 
               (range.max === Infinity || emp.currentSalary < range.max)
      }).length
      
      return {
        range: range.label,
        count,
        min: range.min,
        max: range.max,
      }
    })

    // 2. 부서별 급여 분석
    const departmentGroups = employees.reduce((groups, emp) => {
      if (!groups[emp.department]) {
        groups[emp.department] = []
      }
      groups[emp.department].push(emp)
      return groups
    }, {} as Record<string, typeof employees>)
    
    const departments = Object.entries(departmentGroups).map(([dept, emps]) => {
      const salaries = emps.map(e => e.currentSalary)
      return {
        department: dept,
        _avg: { currentSalary: salaries.reduce((a, b) => a + b, 0) / salaries.length },
        _min: { currentSalary: Math.min(...salaries) },
        _max: { currentSalary: Math.max(...salaries) },
        _count: { id: emps.length }
      }
    })

    const departmentAnalysis = departments.map(dept => ({
      department: dept.department,
      averageSalary: Math.round(dept._avg.currentSalary || 0),
      minSalary: dept._min.currentSalary || 0,
      maxSalary: dept._max.currentSalary || 0,
      employeeCount: dept._count.id,
      salaryRange: (dept._max.currentSalary || 0) - (dept._min.currentSalary || 0),
    }))

    // 3. 인상률 효과 분석
    const projections = []
    for (let rate = 0; rate <= 10; rate += 0.5) {
      const totalCurrent = employees.reduce((sum, emp) => sum + emp.currentSalary, 0)
      const totalProjected = employees.reduce((sum, emp) => 
        sum + Math.round(emp.currentSalary * (1 + rate / 100)), 0
      )
      
      projections.push({
        rate,
        totalCurrent,
        totalProjected,
        increase: totalProjected - totalCurrent,
        budgetImpact: ((totalProjected - totalCurrent) / totalCurrent) * 100,
      })
    }

    // 4. 성과 등급별 급여 분석
    const performanceData = employees.filter(emp => emp.performanceRating)
    const performanceGroups = performanceData.reduce((groups, emp) => {
      const key = `${emp.performanceRating}_${emp.level}`
      if (!groups[key]) {
        groups[key] = {
          performanceRating: emp.performanceRating,
          level: emp.level,
          salaries: [],
          count: 0
        }
      }
      groups[key].salaries.push(emp.currentSalary)
      groups[key].count++
      return groups
    }, {} as Record<string, any>)
    
    const performanceAnalysis = Object.values(performanceGroups).map((group: any) => ({
      performanceRating: group.performanceRating,
      level: group.level,
      _avg: { currentSalary: group.salaries.reduce((a: number, b: number) => a + b, 0) / group.salaries.length },
      _count: { id: group.count }
    }))

    // 5. 근속년수별 분석

    const tenureAnalysis = employees.map(emp => {
      const yearsOfService = currentYear - new Date(emp.hireDate).getFullYear()
      return {
        yearsOfService,
        salary: emp.currentSalary,
        level: emp.level,
      }
    })

    const tenureGroups = [
      { min: 0, max: 2, label: '2년 미만' },
      { min: 2, max: 5, label: '2-5년' },
      { min: 5, max: 10, label: '5-10년' },
      { min: 10, max: Infinity, label: '10년 이상' },
    ]

    const tenureStats = tenureGroups.map(group => {
      const groupEmployees = tenureAnalysis.filter(
        emp => emp.yearsOfService >= group.min && 
               (group.max === Infinity || emp.yearsOfService < group.max)
      )
      
      const avgSalary = groupEmployees.length > 0
        ? Math.round(groupEmployees.reduce((sum, emp) => sum + emp.salary, 0) / groupEmployees.length)
        : 0

      return {
        tenure: group.label,
        employeeCount: groupEmployees.length,
        averageSalary: avgSalary,
      }
    })

    // 6. 예산 활용률 추이
    const totalSalary = employees.reduce((sum, emp) => sum + emp.currentSalary, 0)
    const totalBudget = totalSalary * 1.2 // 총 급여의 120%를 예산으로 가정
    const usedBudget = totalSalary
    
    const budgetUtilization = {
      totalBudget: totalBudget.toString(),
      usedBudget: usedBudget.toString(),
      utilizationRate: (usedBudget / totalBudget) * 100,
    }

    // 7. 평가등급 분포
    const performanceDistribution = ['S', 'A', 'B', 'C'].map(rating => {
      const count = employees.filter(emp => emp.performanceRating === rating).length
      return {
        rating,
        count,
      }
    })
    
    // 8. 평가등급별 평균급여
    const performanceSalary = ['S', 'A', 'B', 'C'].map(rating => {
      const ratingEmployees = employees.filter(emp => emp.performanceRating === rating)
      const avgSalary = ratingEmployees.length > 0
        ? Math.round(ratingEmployees.reduce((sum, emp) => sum + emp.currentSalary, 0) / ratingEmployees.length)
        : 0
      return {
        rating,
        averageSalary: avgSalary,
        count: ratingEmployees.length,
      }
    })
    
    // 9. 직급×평가등급 히트맵 데이터
    const levelPerformance = ['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1'].map(level => {
      const levelData: any = { level }
      ;['S', 'A', 'B', 'C'].forEach(rating => {
        levelData[rating] = employees.filter(emp => 
          emp.level === level && emp.performanceRating === rating
        ).length
      })
      return levelData
    })
    
    // 10. 직급별 통계 (LevelPieChart용)
    const levelStatistics = ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4'].map(level => {
      const levelEmployees = employees.filter(emp => emp.level === level)
      const totalSalary = levelEmployees.reduce((sum, emp) => sum + emp.currentSalary, 0)
      return {
        level,
        employeeCount: levelEmployees.length,
        percentage: (levelEmployees.length / employees.length) * 100,
        totalSalary: totalSalary.toString(),
        avgBaseUpPercentage: 3.2,
        avgMeritPercentage: 2.5,
        totalIncreasePercentage: 5.7
      }
    })
    
    // 11. 부서별 예산 (DepartmentChart용)
    const departmentBudget = Object.entries(departmentGroups).map(([dept, emps]) => ({
      department: dept,
      budget: emps.reduce((sum, emp) => sum + emp.currentSalary, 0),
      headcount: emps.length,
    }))
    
    // 12. 평가등급별 인상액 (PerformanceChart용) 
    const performanceIncrease = ['ST', 'AT', 'OT', 'BT'].map(rating => {
      const weights = { ST: 1.5, AT: 1.2, OT: 1.0, BT: 0.8 }
      const ratingEmployees = employees.filter(emp => emp.performanceRating === rating)
      const baseUp = 3.2
      const merit = 2.5
      
      const totalIncrease = ratingEmployees.reduce((sum, emp) => {
        const meritWithWeight = merit * weights[rating as keyof typeof weights]
        return sum + emp.currentSalary * (baseUp + meritWithWeight) / 100
      }, 0)
      
      return {
        rating,
        totalIncrease: Math.round(totalIncrease),
        averageIncrease: ratingEmployees.length > 0 
          ? Math.round(totalIncrease / ratingEmployees.length)
          : 0,
        count: ratingEmployees.length,
      }
    })

    return NextResponse.json({
      salaryDistribution,
      departmentAnalysis,
      projections,
      performanceAnalysis: performanceAnalysis.map(item => ({
        performanceRating: item.performanceRating,
        level: item.level,
        averageSalary: Math.round(item._avg.currentSalary || 0),
        count: item._count.id,
      })),
      tenureStats,
      budgetUtilization,
      performanceDistribution,
      performanceSalary,
      levelPerformance,
      levelStatistics,
      departmentBudget,
      performanceIncrease,
    })
  } catch (error) {
    console.error('Analytics API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}