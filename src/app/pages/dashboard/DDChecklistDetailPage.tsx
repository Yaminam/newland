import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardCheck } from 'lucide-react'
import { SEO } from '@/app/components/SEO'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { DDChecklistDetailContent } from '@/app/components/dd-checklist/DDChecklistDetailContent'
import { useDDChecklists } from '@/app/hooks/useDDChecklists'

const BACK_PATH = '/dashboard/dd-checklist'

export function DDChecklistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dd = useDDChecklists()
  const { checklists, isLoading, isFounder } = dd

  const checklist = useMemo(() => checklists.find(c => c.id === id) ?? null, [checklists, id])
  const viewMode: 'founder' | 'investor' = isFounder ? 'founder' : 'investor'
  const goBack = () => navigate(BACK_PATH)

  if (isLoading) {
    return (
      <div className="p-1">
        <SkeletonBlock height={150} className="mb-4" />
        <SkeletonBlock height={360} />
      </div>
    )
  }

  if (!checklist) {
    return (
      <>
        <SEO title="DD Checklist" />
        <EmptyState
          icon={<ClipboardCheck className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
          title="Checklist not found"
          description="This checklist may have been removed, archived, or you no longer have access."
          action={{ label: 'Back to Due Diligence', onClick: goBack }}
        />
      </>
    )
  }

  return (
    <>
      <SEO title={checklist.name} />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <DDChecklistDetailContent
          checklist={checklist}
          variant="page"
          onBack={goBack}
          onClose={goBack}
          viewMode={viewMode}
          onLoadDetail={dd.loadChecklistDetail}
          onUpdateChecklist={dd.updateChecklist}
          onDeleteChecklist={isFounder ? dd.deleteChecklist : undefined}
          onAddItem={dd.addItem}
          onUpdateItem={dd.updateItem}
          onToggleItem={dd.toggleItem}
          onRemoveItem={dd.removeItem}
          onUploadDoc={isFounder ? dd.uploadItemDoc : undefined}
          onViewDoc={dd.viewItemDoc}
          onVerify={!isFounder ? dd.verifyItem : undefined}
          onRequestReupload={!isFounder ? dd.requestReupload : undefined}
          onFlag={!isFounder ? dd.flagItem : undefined}
          onAnalyzeChecklist={isFounder ? dd.analyzeChecklist : undefined}
          onGenerateReport={isFounder ? dd.generateReport : undefined}
        />
      </motion.div>
    </>
  )
}
