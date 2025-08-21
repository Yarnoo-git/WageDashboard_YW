'use client'

import { BandName, LevelType, HeatmapData } from '@/types/band'

interface CompetitivenessHeatmapProps {
  data: HeatmapData[]
  competitivenessTarget: 'SBL' | 'CA'
  onCellClick?: (band: BandName, level: LevelType) => void
}

export function CompetitivenessHeatmap({
  data,
  competitivenessTarget,
  onCellClick
}: CompetitivenessHeatmapProps) {
  const levels: LevelType[] = ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4']
  
  // data가 없거나 빈 배열인 경우 처리
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-center text-gray-500 py-8">
          데이터를 불러오는 중입니다...
        </div>
      </div>
    )
  }
  
  // 색상 결정 함수
  const getCellColor = (value: number): string => {
    if (value < 95) {
      // Red 계열 (경쟁력 낮음)
      if (value < 90) return 'bg-red-600 text-white'
      if (value < 93) return 'bg-red-500 text-white'
      return 'bg-red-400 text-white'
    } else if (value > 105) {
      // Green 계열 (경쟁력 높음)
      if (value > 115) return 'bg-green-600 text-white'
      if (value > 110) return 'bg-green-500 text-white'
      return 'bg-green-400 text-white'
    } else {
      // Neutral 계열 (적정)
      if (value < 98) return 'bg-yellow-200 text-gray-800'
      if (value > 102) return 'bg-blue-200 text-gray-800'
      return 'bg-gray-200 text-gray-800'
    }
  }

  // 평균 계산
  const calculateAverage = (band: HeatmapData): number => {
    let totalValue = 0
    let totalHeadcount = 0
    
    levels.forEach(level => {
      const levelData = band.levels[level]
      if (levelData) {
        totalValue += levelData.competitiveness * levelData.headcount
        totalHeadcount += levelData.headcount
      }
    })
    
    return totalHeadcount > 0 ? totalValue / totalHeadcount : 0
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-900">보상 경쟁력 Heatmap</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">기준:</span>
          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm font-semibold">
            {competitivenessTarget}
          </span>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>&lt;95 (낮음)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span>95-105 (적정)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>&gt;105 (높음)</span>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0">
        <table className="w-full md:min-w-[600px] text-xs md:text-sm">
          <thead>
            <tr>
              <th className="text-left px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
                직군
              </th>
              {levels.map(level => (
                <th key={level} className="text-center px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
                  {level}
                </th>
              ))}
              <th className="text-center px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
                평균
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((band, idx) => {
              const avgValue = calculateAverage(band)
              return (
                <tr key={band.band} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-2 py-2 text-sm font-medium text-gray-900 border-r">
                    {band.band}
                  </td>
                  {levels.map(level => {
                    const cellData = band.levels[level]
                    if (!cellData) {
                      return (
                        <td key={level} className="text-center px-2 py-2">
                          <div className="text-gray-400 text-xs">-</div>
                        </td>
                      )
                    }
                    
                    const cellColor = getCellColor(cellData.competitiveness)
                    return (
                      <td key={level} className="text-center px-1 py-1">
                        <button
                          onClick={() => onCellClick?.(band.band, level)}
                          className={`w-full px-2 py-2 rounded transition-all hover:scale-105 ${cellColor}`}
                        >
                          <div className="font-semibold text-sm">
                            {cellData.competitiveness.toFixed(1)}
                          </div>
                          <div className="text-xs opacity-80">
                            {cellData.headcount}명
                          </div>
                        </button>
                      </td>
                    )
                  })}
                  <td className="text-center px-2 py-2 border-l">
                    <div className={`inline-block px-3 py-1 rounded ${getCellColor(avgValue)}`}>
                      <div className="font-semibold text-sm">
                        {avgValue.toFixed(1)}
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {/* 전체 평균 행 */}
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-100">
              <td className="px-2 py-2 text-sm font-semibold text-gray-900">
                전체 평균
              </td>
              {levels.map(level => {
                let totalValue = 0
                let totalHeadcount = 0
                
                data.forEach(band => {
                  const levelData = band.levels[level]
                  if (levelData) {
                    totalValue += levelData.competitiveness * levelData.headcount
                    totalHeadcount += levelData.headcount
                  }
                })
                
                const avgValue = totalHeadcount > 0 ? totalValue / totalHeadcount : 0
                
                return (
                  <td key={level} className="text-center px-2 py-2">
                    <div className={`inline-block px-3 py-1 rounded ${getCellColor(avgValue)}`}>
                      <div className="font-semibold text-sm">
                        {avgValue.toFixed(1)}
                      </div>
                    </div>
                  </td>
                )
              })}
              <td className="text-center px-2 py-2 border-l">
                <div className="font-bold text-sm text-gray-900">
                  {(() => {
                    let totalValue = 0
                    let totalHeadcount = 0
                    
                    data.forEach(band => {
                      levels.forEach(level => {
                        const levelData = band.levels[level]
                        if (levelData) {
                          totalValue += levelData.competitiveness * levelData.headcount
                          totalHeadcount += levelData.headcount
                        }
                      })
                    })
                    
                    return totalHeadcount > 0 ? (totalValue / totalHeadcount).toFixed(1) : '0.0'
                  })()}
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 요약 정보 */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">경쟁력 부족</p>
          <p className="text-lg font-bold text-red-600">
            {data.reduce((count, band) => {
              return count + levels.filter(level => {
                const levelData = band.levels[level]
                return levelData && levelData.competitiveness < 95
              }).length
            }, 0)}개
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">적정 수준</p>
          <p className="text-lg font-bold text-gray-600">
            {data.reduce((count, band) => {
              return count + levels.filter(level => {
                const levelData = band.levels[level]
                return levelData && levelData.competitiveness >= 95 && levelData.competitiveness <= 105
              }).length
            }, 0)}개
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">경쟁력 우위</p>
          <p className="text-lg font-bold text-green-600">
            {data.reduce((count, band) => {
              return count + levels.filter(level => {
                const levelData = band.levels[level]
                return levelData && levelData.competitiveness > 105
              }).length
            }, 0)}개
          </p>
        </div>
      </div>
    </div>
  )
}