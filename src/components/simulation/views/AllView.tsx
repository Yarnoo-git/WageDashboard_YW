/**
 * AllView - 종합 현황 뷰 컴포넌트
 * 전체 직군의 통합 현황을 표시
 */

'use client'

import React from 'react'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface LevelData {
  level: string
  headcount: number
  meanBasePay: number
  baseUpRate: number
  meritRate?: number
  totalRate?: number
  company: {
    median: number
    mean: number
  }
  competitor: {
    median: number
  }
}

interface AllViewProps {
  totalEmployees: number
  totalBudget: number
  usedBudget: number
  levels: LevelData[]
  baseUpRate: number
  meritRate: number
  totalRate: number
}

export function AllView({
  totalEmployees,
  totalBudget,
  usedBudget,
  levels,
  baseUpRate,
  meritRate,
  totalRate
}: AllViewProps) {
  const budgetUsageRate = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0
  const remainingBudget = totalBudget - usedBudget
  
  return (
    <div className="space-y-4">
      {/* 전체 요약 카드 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">전체 현황</h2>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">총 인원</div>
            <div className="text-2xl font-bold text-gray-900">
              {totalEmployees.toLocaleString()}명
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">평균 인상률</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Base-up {baseUpRate.toFixed(1)}% + Merit {meritRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">예산 사용률</div>
            <div className={`text-2xl font-bold ${
              budgetUsageRate > 90 ? 'text-red-600' :
              budgetUsageRate > 70 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {budgetUsageRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatKoreanCurrency(usedBudget)}
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">잔여 예산</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatKoreanCurrency(remainingBudget)}
            </div>
          </div>
        </div>
        
        {/* 직급별 집계 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">직급</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">인원</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">평균 급여</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Base-up</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Merit</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">총 인상률</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">C사 대비</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(level => {
                const competitiveness = level.competitor.median > 0 
                  ? (level.company.median / level.competitor.median) * 100 
                  : 100
                const total = (level.baseUpRate || 0) + (level.meritRate || 0)
                
                return (
                  <tr key={level.level} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{level.level}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {level.headcount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatKoreanCurrency(level.meanBasePay)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-blue-600 font-medium">
                        {level.baseUpRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-600 font-medium">
                        {(level.meritRate || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-gray-900">
                        {total.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        competitiveness >= 110 ? 'bg-green-100 text-green-700' :
                        competitiveness >= 90 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {competitiveness.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td className="px-4 py-3">합계</td>
                <td className="px-4 py-3 text-right">
                  {levels.reduce((sum, l) => sum + l.headcount, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatKoreanCurrency(
                    levels.reduce((sum, l) => sum + l.meanBasePay * l.headcount, 0) /
                    levels.reduce((sum, l) => sum + l.headcount, 0) || 0
                  )}
                </td>
                <td className="px-4 py-3 text-right text-blue-600">
                  {baseUpRate.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right text-green-600">
                  {meritRate.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right text-gray-900">
                  {totalRate.toFixed(1)}%
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {/* 차트 섹션 추가 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 직급별 경쟁력 차트 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">직급별 보상 경쟁력</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={levels.filter(l => l.headcount > 0)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
              <Legend />
              <Line
                type="monotone"
                dataKey={(data: any) => {
                  const comp = data.competitor.median > 0 
                    ? (data.company.median / data.competitor.median) * 100
                    : 0
                  return comp
                }}
                stroke="#2563eb"
                strokeWidth={2}
                name="경쟁력 지수"
                dot={{ fill: '#2563eb' }}
              />
              <Line
                y={100}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="목표선 (100%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* 직급별 인상률 분포 차트 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">직급별 인상률 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={levels.filter(l => l.headcount > 0)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="baseUpRate" name="Base-up" stackId="a" fill="#3b82f6" />
              <Bar dataKey="meritRate" name="Merit" stackId="a" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 직급별 인원 분포 차트 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">직급별 인원 분포</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={levels.filter(l => l.headcount > 0)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="level" />
            <YAxis />
            <Tooltip formatter={(value: any) => `${value.toLocaleString()}명`} />
            <Bar dataKey="headcount" name="인원수">
              {levels.filter(l => l.headcount > 0).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][index % 4]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* 급여 분포 차트 섹션 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">직급별 급여 분포</h3>
        
        <div className="space-y-3">
          {levels.map(level => {
            const maxSalary = Math.max(...levels.map(l => l.meanBasePay))
            const widthPercentage = (level.meanBasePay / maxSalary) * 100
            
            return (
              <div key={level.level} className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium text-gray-700">
                  {level.level}
                </div>
                <div className="flex-1">
                  <div className="relative bg-gray-200 rounded-full h-6">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${widthPercentage}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white">
                      {formatKoreanCurrency(level.meanBasePay)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {level.headcount}명
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}