import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { documentsAPI } from '../../services/api';
import { fmtDate, downloadBase64 } from '../../utils';

const TYPE_ICON = { Legal: '⚖️', Allocation: '🏠', Payment: '💳', Survey: '📐', default: '📄' };

function DocCard({ doc, onDownload, downloading }) {
  const isNew     = doc.uploaded_at && (Date.now() - new Date(doc.uploaded_at)) < 7 * 86400000;
  const typeIcon  = TYPE_ICON[doc.document_type] || TYPE_ICON.default;
  const sizeKB    = doc.file_size ? Math.round(doc.file_size / 1024) + ' KB' : '';

  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center flex-shrink-0">
        <span className="text-2xl">{typeIcon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-800 text-textmain text-sm truncate">{doc.document_title || doc.title}</p>
          {isNew && <span className="flex-shrink-0 bg-red text-white text-[9px] font-800 px-1.5 py-0.5 rounded-full">NEW</span>}
        </div>
        {doc.estate_name && <p className="text-xs text-textsub">{doc.estate_name}</p>}
        <p className="text-xs text-textmuted">{fmtDate(doc.uploaded_at || doc.created_at)} {sizeKB ? '· ' + sizeKB : ''}</p>
      </div>
      <button
        onClick={() => onDownload(doc)}
        disabled={downloading === doc.id}
        className="flex-shrink-0 bg-navy text-white text-xs font-700 px-3 py-2 rounded-xl disabled:opacity-60 flex items-center gap-1"
      >
        {downloading === doc.id ? <Spinner size="sm" color="white" /> : '↓'}
      </button>
    </div>
  );
}

export default function Documents() {
  const { showToast } = useToast();
  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    documentsAPI.getMy().then(r => setDocs(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleDownload(doc) {
    setDownloading(doc.id);
    try {
      const r = await documentsAPI.download(doc.id);
      const data = r.data;
      // Handle base64 response
      const b64 = data?.base64 || data?.pdf_base64 || data?.file_base64;
      if (b64) {
        downloadBase64(b64, doc.file_name || `${doc.document_title || 'document'}.pdf`);
        showToast('Download started', 'success');
      } else {
        showToast('Unable to download this document', 'error');
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Download failed', 'error');
    } finally { setDownloading(null); }
  }

  // Group by type
  const groups = docs.reduce((acc, doc) => {
    const t = doc.document_type || 'Other';
    if (!acc[t]) acc[t] = [];
    acc[t].push(doc);
    return acc;
  }, {});

  return (
    <Layout>
      <TopHeader title="My Documents" />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : docs.length === 0 ? (
        <div className="px-4 py-4">
          <EmptyState
            icon="📂"
            title="No documents yet"
            subtitle="Your contracts and legal documents will appear here once available."
          />
        </div>
      ) : (
        <div className="px-4 py-4">
          {/* Status overview */}
          <div className="bg-navy rounded-2xl p-4 mb-5">
            <p className="text-white/60 text-xs font-700 uppercase mb-3">Document Vault</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', val: docs.length },
                { label: 'New', val: docs.filter(d => d.uploaded_at && (Date.now() - new Date(d.uploaded_at)) < 7 * 86400000).length },
                { label: 'Types', val: Object.keys(groups).length },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/10 text-center">
                  <p className="text-white font-900 text-lg">{s.val}</p>
                  <p className="text-white/50 text-[10px] font-700">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents by type */}
          {Object.entries(groups).map(([type, typeDocs]) => (
            <div key={type} className="mb-5">
              <p className="text-sm font-800 text-textmain mb-3">{TYPE_ICON[type] || '📁'} {type}</p>
              <div className="space-y-3">
                {typeDocs.map(doc => (
                  <DocCard key={doc.id} doc={doc} onDownload={handleDownload} downloading={downloading} />
                ))}
              </div>
            </div>
          ))}

          <div className="h-4" />
        </div>
      )}
    </Layout>
  );
}
