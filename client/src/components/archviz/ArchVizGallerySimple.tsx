import { trpc } from "@/lib/trpc";

interface ArchVizGallerySimpleProps {
  constructionId: number;
}

export function ArchVizGallerySimple({ constructionId }: ArchVizGallerySimpleProps) {
  const { data: renders, isLoading, error } = trpc.archviz.renders.listByConstruction.useQuery({
    constructionId,
  });

  console.log('ArchVizGallerySimple - constructionId:', constructionId);
  console.log('ArchVizGallerySimple - isLoading:', isLoading);
  console.log('ArchVizGallerySimple - error:', error);
  console.log('ArchVizGallerySimple - renders:', renders);

  if (isLoading) {
    return <div className="p-8 text-center">A carregar renders...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Erro ao carregar renders:</p>
        <pre className="mt-2 text-sm">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Renders Encontrados: {renders?.length || 0}</h2>
      {renders && renders.length > 0 ? (
        <div className="space-y-4">
          {renders.map((render: any) => (
            <div key={render.id} className="p-4 border rounded">
              <h3 className="font-bold">{render.name}</h3>
              <p className="text-sm text-gray-600">Versão: {render.version}</p>
              <p className="text-sm text-gray-600">Status: {render.status}</p>
              <p className="text-sm text-gray-600">Compartimento ID: {render.compartmentId}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>Nenhum render encontrado.</p>
      )}
    </div>
  );
}
