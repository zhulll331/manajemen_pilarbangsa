import EditorKegiatanClient from '../[id]/EditorKegiatanClient';

export const dynamic = 'force-dynamic';

export default function BaruKegiatanPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <EditorKegiatanClient
        initialEvent={null}
        initialResources={[]}
        isNew={true}
      />
    </div>
  );
}
