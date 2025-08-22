'use client'

import React from 'react'

interface AdjustmentScopeProps {
  scope: 'all' | 'level' | 'payzone'
  onChange: (scope: 'all' | 'level' | 'payzone') => void
  pendingChanges?: number
}

export function AdjustmentScope({ scope, onChange, pendingChanges = 0 }: AdjustmentScopeProps) {
  const scopes = [
    { value: 'all', label: '전체 조정', description: '모든 직원에게 동일 적용' },
    { value: 'level', label: '레벨별 조정', description: '레벨별로 차등 적용' },
    { value: 'payzone', label: 'Pay Zone별 조정', description: 'Pay Zone×레벨별 세분화' }
  ] as const

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">조정 범위</h3>
        {pendingChanges > 0 && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
            {pendingChanges}개 변경사항
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {scopes.map((s) => (
          <button
            key={s.value}
            onClick={() => onChange(s.value as 'all' | 'level' | 'payzone')}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              scope === s.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{s.label}</div>
                <div className="text-sm text-gray-500 mt-0.5">{s.description}</div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                scope === s.value
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {scope === s.value && (
                  <div className="w-full h-full rounded-full bg-white scale-50" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* 현재 선택된 범위에 대한 추가 정보 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          {scope === 'all' && (
            <>
              <strong>전체 조정 모드</strong>
              <p className="mt-1">모든 직원에게 동일한 인상률이 적용됩니다.</p>
            </>
          )}
          {scope === 'level' && (
            <>
              <strong>레벨별 조정 모드</strong>
              <p className="mt-1">L1~L10 각 레벨별로 다른 인상률을 적용할 수 있습니다.</p>
            </>
          )}
          {scope === 'payzone' && (
            <>
              <strong>Pay Zone별 조정 모드</strong>
              <p className="mt-1">Pay Zone(1~8)와 레벨을 조합하여 세분화된 인상률을 적용할 수 있습니다.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}