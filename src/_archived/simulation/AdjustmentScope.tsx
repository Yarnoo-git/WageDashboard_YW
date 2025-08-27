'use client'

import React from 'react'

interface AdjustmentScopeProps {
  scope: 'all' | 'band' | 'level' | 'payzone'
  onChange: (scope: 'all' | 'band' | 'level' | 'payzone') => void
  pendingChanges?: number
}

export function AdjustmentScope({ scope, onChange, pendingChanges = 0 }: AdjustmentScopeProps) {
  const scopes = [
    { value: 'all', label: '전체 조정', icon: '🌐', description: '모든 직원 일괄' },
    { value: 'band', label: '직군별', icon: '🏢', description: '8개 직군별' },
    { value: 'level', label: '직급별', icon: '📊', description: 'Lv.1~4 직급별' },
    { value: 'payzone', label: 'Pay Zone별', icon: '🎯', description: '세밀한 Zone별' }
  ] as const

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">조정 범위</h3>
        {pendingChanges > 0 && (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            {pendingChanges}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {scopes.map((s) => (
          <button
            key={s.value}
            onClick={() => onChange(s.value as 'all' | 'band' | 'level' | 'payzone')}
            className={`px-3 py-3 text-sm font-medium rounded-lg border transition-all ${
              scope === s.value
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">{s.icon}</span>
              <span className="font-semibold">{s.label}</span>
              <span className="text-xs text-gray-500">{s.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}