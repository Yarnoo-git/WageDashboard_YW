'use client'

import React from 'react'

interface AdjustmentScopeProps {
  scope: 'all' | 'level' | 'payzone'
  onChange: (scope: 'all' | 'level' | 'payzone') => void
  pendingChanges?: number
}

export function AdjustmentScope({ scope, onChange, pendingChanges = 0 }: AdjustmentScopeProps) {
  const scopes = [
    { value: 'all', label: '전체 조정' },
    { value: 'level', label: '레벨별' },
    { value: 'payzone', label: 'Pay Zone별' }
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
      
      <div className="flex gap-2">
        {scopes.map((s) => (
          <button
            key={s.value}
            onClick={() => onChange(s.value as 'all' | 'level' | 'payzone')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
              scope === s.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}