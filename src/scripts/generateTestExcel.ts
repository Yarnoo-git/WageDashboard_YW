/**
 * 테스트용 엑셀 파일 생성 스크립트
 * 평가등급이 포함된 2개의 엑셀 파일 생성
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { 
  generateEmployeeData, 
  convertToExcelFormat,
  calculateBandStatistics 
} from '../lib/bandDataGenerator'

// 파일 1: 기본 데이터 (표준 분포)
console.log('🔄 파일 1: 표준 분포 직원 데이터 생성 중...')
const standardEmployees = generateEmployeeData(1000) // 개발/테스트용 1000명

// 파일 2: 테스트 데이터 (다른 분포 - S,A 등급 더 많이)
console.log('🔄 파일 2: 테스트용 직원 데이터 생성 중...')
const testEmployees = generateEmployeeData(1000).map(emp => {
  // 테스트용으로 다른 평가등급 분포 적용 (S:20%, A:40%, B:30%, C:10%)
  const rand = Math.random()
  const performanceRating: 'ST' | 'AT' | 'OT' | 'BT' = rand < 0.2 ? 'ST' :
                           rand < 0.6 ? 'AT' :
                           rand < 0.9 ? 'OT' : 'BT'
  return { ...emp, performanceRating }
})

// 두 데이터셋 모두 엑셀 형식으로 변환
const standardExcelData = convertToExcelFormat(standardEmployees)
const testExcelData = convertToExcelFormat(testEmployees)

// 통계 계산
const standardStats = calculateBandStatistics(standardEmployees)
const testStats = calculateBandStatistics(testEmployees)

// AI 설정 데이터
const aiSettingsData = [
  { '항목': 'Base-up(%)', '값': 3.2, '설명': 'AI 제안 기본 인상률' },
  { '항목': '성과인상률(%)', '값': 2.5, '설명': 'AI 제안 성과 인상률' },
  { '항목': '총인상률(%)', '값': 5.7, '설명': 'AI 제안 총 인상률' },
  { '항목': '최소범위(%)', '값': 5.7, '설명': '권장 인상률 최소값' },
  { '항목': '최대범위(%)', '값': 5.9, '설명': '권장 인상률 최대값' }
]

// 직급별 기준 데이터
const levelStandardsData = ['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1'].map(level => ({
  '직급': level,
  '기준Base-up(%)': 3.2,
  '기준성과인상률(%)': 2.5,
  '설명': `${level} 기본 인상률 설정`
}))

// 평가등급 분포 확인 함수
function getPerformanceDistribution(employees: any[]) {
  const dist = { ST: 0, AT: 0, OT: 0, BT: 0 }
  employees.forEach(emp => {
    const rating = emp['평가등급'] || emp.performanceRating || 'OT'
    if (rating in dist) {
      dist[rating as keyof typeof dist]++
    }
  })
  return dist
}

// 파일 1: 표준 데이터 워크북 생성
console.log('📊 파일 1: 표준 데이터 엑셀 생성 중...')
const wb1 = XLSX.utils.book_new()

// AI설정 시트
const aiSheet1 = XLSX.utils.json_to_sheet(aiSettingsData)
aiSheet1['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 30 }]
XLSX.utils.book_append_sheet(wb1, aiSheet1, 'AI설정')

// 직원기본정보 시트
const employeeSheet1 = XLSX.utils.json_to_sheet(standardExcelData)
employeeSheet1['!cols'] = [
  { wch: 10 }, // 사번
  { wch: 10 }, // 이름
  { wch: 15 }, // 부서
  { wch: 12 }, // 직군
  { wch: 8 },  // 직급
  { wch: 8 },  // 직책
  { wch: 12 }, // 입사일
  { wch: 15 }, // 현재연봉
  { wch: 10 }, // 평가등급
]
XLSX.utils.book_append_sheet(wb1, employeeSheet1, '직원기본정보')

// 직급별기준 시트
const levelSheet1 = XLSX.utils.json_to_sheet(levelStandardsData)
levelSheet1['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 30 }]
XLSX.utils.book_append_sheet(wb1, levelSheet1, '직급별기준')

// 파일 2: 테스트 데이터 워크북 생성
console.log('📊 파일 2: 테스트 데이터 엑셀 생성 중...')
const wb2 = XLSX.utils.book_new()

// AI설정 시트 (다른 값으로 테스트)
const testAiSettings = [
  { '항목': 'Base-up(%)', '값': 3.5, '설명': 'AI 제안 기본 인상률 (테스트)' },
  { '항목': '성과인상률(%)', '값': 3.0, '설명': 'AI 제안 성과 인상률 (테스트)' },
  { '항목': '총인상률(%)', '값': 6.5, '설명': 'AI 제안 총 인상률 (테스트)' },
  { '항목': '최소범위(%)', '값': 6.0, '설명': '권장 인상률 최소값' },
  { '항목': '최대범위(%)', '값': 7.0, '설명': '권장 인상률 최대값' }
]

const aiSheet2 = XLSX.utils.json_to_sheet(testAiSettings)
aiSheet2['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 30 }]
XLSX.utils.book_append_sheet(wb2, aiSheet2, 'AI설정')

// 직원기본정보 시트
const employeeSheet2 = XLSX.utils.json_to_sheet(testExcelData)
employeeSheet2['!cols'] = [
  { wch: 10 }, // 사번
  { wch: 10 }, // 이름
  { wch: 15 }, // 부서
  { wch: 12 }, // 직군
  { wch: 8 },  // 직급
  { wch: 8 },  // 직책
  { wch: 12 }, // 입사일
  { wch: 15 }, // 현재연봉
  { wch: 10 }, // 평가등급
]
XLSX.utils.book_append_sheet(wb2, employeeSheet2, '직원기본정보')

// 직급별기준 시트
XLSX.utils.book_append_sheet(wb2, levelSheet1, '직급별기준')

// 파일 저장
const publicDir = path.join(process.cwd(), 'public', 'data')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

const file1Path = path.join(publicDir, 'employee_data_standard.xlsx')
const file2Path = path.join(publicDir, 'employee_data_test.xlsx')

XLSX.writeFile(wb1, file1Path)
XLSX.writeFile(wb2, file2Path)

// 평가등급 분포 출력
const dist1 = getPerformanceDistribution(standardExcelData)
const dist2 = getPerformanceDistribution(testExcelData)

console.log('\n✅ 엑셀 파일 생성 완료!')
console.log(`📁 파일 1: ${file1Path}`)
console.log(`   - 총 인원: ${standardExcelData.length}명`)
console.log(`   - 평가등급 분포: ST(${dist1.ST}명), AT(${dist1.AT}명), OT(${dist1.OT}명), BT(${dist1.BT}명)`)
console.log(`   - 비율: ST(${(dist1.ST/standardExcelData.length*100).toFixed(1)}%), AT(${(dist1.AT/standardExcelData.length*100).toFixed(1)}%), OT(${(dist1.OT/standardExcelData.length*100).toFixed(1)}%), BT(${(dist1.BT/standardExcelData.length*100).toFixed(1)}%)`)

console.log(`\n📁 파일 2: ${file2Path}`)
console.log(`   - 총 인원: ${testExcelData.length}명`)
console.log(`   - 평가등급 분포: ST(${dist2.ST}명), AT(${dist2.AT}명), OT(${dist2.OT}명), BT(${dist2.BT}명)`)
console.log(`   - 비율: ST(${(dist2.ST/testExcelData.length*100).toFixed(1)}%), AT(${(dist2.AT/testExcelData.length*100).toFixed(1)}%), OT(${(dist2.OT/testExcelData.length*100).toFixed(1)}%), BT(${(dist2.BT/testExcelData.length*100).toFixed(1)}%)`)

// 기존 default_employee_data.xlsx도 업데이트
const defaultPath = path.join(publicDir, 'default_employee_data.xlsx')
XLSX.writeFile(wb1, defaultPath)
console.log(`\n📁 기본 파일 업데이트: ${defaultPath}`)