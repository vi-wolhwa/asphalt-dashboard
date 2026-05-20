import { useState } from 'react';
import { useSelectedIncident } from '../../contexts/SelectedIncidentContext';
import { useImageWithHeaders } from '../../hooks/useImageWithHeaders';
import RepairManageModal from './RepairManageModal';
import styles from './IncidentDetailModal.module.scss';

import type { RiskLevel, RepairStatus } from '../../types/incident';

const RISK_COLORS: Record<RiskLevel, string> = {
  긴급: '#ea5a52',
  주의: '#efaa3a',
  낮음: '#f3d746',
};

const STATUS_COLORS: Record<RepairStatus, string> = {
  보수전: '#ef4444',
  보수중: '#3b82f6',
  보수완료: '#10b981',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function shortId(id: string): string {
  return id.replace(/^INC-/, '#');
}

/** 스켈레톤용 라벨 목록 (실제 데이터와 동일한 순서·위치) */
const SKELETON_LABELS = ['주소', '위험도', '크기', '최초 확인 시각', '보수완료 시각'];

export default function IncidentDetailModal() {
  const { selectedId, setSelectedId, detail, loading, error } = useSelectedIncident();
  const [repairOpen, setRepairOpen] = useState(false);

  const { blobUrl: photoSrc, loading: photoLoading, error: photoError } = useImageWithHeaders(detail?.photo_url);

  if (!selectedId) return null;

  function handleBackdropClick() {
    if (repairOpen) return;
    setSelectedId(null);
  }

  function handleRepairClose() {
    setRepairOpen(false);
  }

  return (
    <>
      <div className={styles.backdrop} onClick={handleBackdropClick}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* ── 로딩 스켈레톤 ── */}
          {loading && (
            <>
              {/* 헤더 88px — 실제와 동일 구조 */}
              <div className={styles.header}>
                <div>
                  <span className={styles.headerLabel}>포트홀 ID</span>
                  <div className={styles.skeletonIdLine} />
                </div>
                <button
                  type="button"
                  className={styles.headerClose}
                  onClick={() => setSelectedId(null)}
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              {/* 사진 440×440 */}
              <div className={styles.skeletonPhoto} />
              {/* 정보: 라벨 유지 + 데이터 shimmer */}
              <div className={styles.info}>
                {SKELETON_LABELS.map((label) => (
                  <div key={label} className={styles.infoRow}>
                    <span className={styles.infoLabel}>{label}</span>
                    <span className={styles.shimmerLine} />
                  </div>
                ))}
              </div>
              {/* 버튼 비활성화 */}
              <div className={styles.footer}>
                <button type="button" className={styles.manageBtn} disabled>
                  보수 관리
                </button>
              </div>
            </>
          )}

          {/* ── 에러 ── */}
          {error && !loading && (
            <div className={styles.errorOverlay}>
              <p>{error}</p>
              <button type="button" onClick={() => setSelectedId(null)}>
                닫기
              </button>
            </div>
          )}

          {/* ── 상세 데이터 ── */}
          {detail && !loading && (
            <>
              {/* 파란 헤더 88px */}
              <div className={styles.header}>
                <div>
                  <span className={styles.headerLabel}>포트홀 ID</span>
                  <h2 className={styles.headerId}>{shortId(detail.incident_id)}</h2>
                </div>
                <button
                  type="button"
                  className={styles.headerClose}
                  onClick={() => setSelectedId(null)}
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>

              {/* 사진 440×440 */}
              <div className={styles.photoWrap}>
                {photoLoading && (
                  <div className={styles.photoPlaceholder}>
                    <span className={styles.photoSpinner} />
                  </div>
                )}
                {photoError && !photoLoading && (
                  <div className={styles.photoPlaceholder}>
                    <span className={styles.photoErrorText}>이미지를 불러올 수 없습니다</span>
                  </div>
                )}
                {photoSrc && !photoLoading && !photoError && (
                  <img
                    src={photoSrc}
                    alt={`포트홀 ${detail.incident_id} 사진`}
                    className={styles.photo}
                    width={440}
                    height={440}
                  />
                )}
                <span
                  className={styles.statusBadge}
                  style={{
                    borderColor: STATUS_COLORS[detail.status],
                    color: STATUS_COLORS[detail.status],
                  }}
                >
                  {detail.status}
                </span>
              </div>

              {/* 정보 — 보수완료 시각 항상 공간 확보 */}
              <div className={styles.info}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>주소</span>
                  <span className={styles.infoValue}>{detail.address}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>위험도</span>
                  <span className={styles.infoValue} style={{ color: RISK_COLORS[detail.risk_level], fontWeight: 600 }}>
                    {detail.risk_level}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>크기</span>
                  <span className={styles.infoValue}>{detail.size_label}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>최초 확인 시각</span>
                  <span className={styles.infoValue}>{formatDateTime(detail.first_detected_at)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>보수완료 시각</span>
                  <span className={styles.infoValue}>
                    {detail.recovered_at ? formatDateTime(detail.recovered_at) : '—'}
                  </span>
                </div>
              </div>

              {/* 보수 관리 버튼 */}
              <div className={styles.footer}>
                <button type="button" className={styles.manageBtn} onClick={() => setRepairOpen(true)}>
                  보수 관리
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {repairOpen && detail && (
        <RepairManageModal incidentId={detail.incident_id} currentStatus={detail.status} onClose={handleRepairClose} />
      )}
    </>
  );
}
