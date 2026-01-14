import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Mail,
  Trash2,
  Download,
  Tag,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface EmailBulkActionsProps {
  selectedEmails: number[];
  onClearSelection: () => void;
  onRefresh: () => void;
  projectName: string;
}

export function EmailBulkActions({
  selectedEmails,
  onClearSelection,
  onRefresh,
  projectName,
}: EmailBulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Mutations
  const markAsReadMutation = trpc.emailHistory.markAsRead.useMutation({
    onSuccess: () => {
      onRefresh();
      onClearSelection();
    },
  });

  const resendMutation = trpc.emailHistory.resendBulk.useMutation({
    onSuccess: () => {
      onRefresh();
      onClearSelection();
    },
  });

  const deleteMutation = trpc.emailHistory.deleteBulk.useMutation({
    onSuccess: () => {
      onRefresh();
      onClearSelection();
    },
  });

  const exportMutation = trpc.emailHistory.exportBulkPDF.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
  });

  const tagMutation = trpc.emailHistory.tagBulk.useMutation({
    onSuccess: () => {
      onRefresh();
      setShowTagInput(false);
      setTagInput('');
    },
  });

  if (selectedEmails.length === 0) {
    return null;
  }

  const handleMarkAsRead = async () => {
    setIsLoading(true);
    try {
      await markAsReadMutation.mutateAsync({ emailIds: selectedEmails });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await resendMutation.mutateAsync({ emailIds: selectedEmails });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Tem a certeza que deseja eliminar ${selectedEmails.length} email(s)?`)) {
      return;
    }
    setIsLoading(true);
    try {
      await deleteMutation.mutateAsync({ emailIds: selectedEmails });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await exportMutation.mutateAsync({
        emailIds: selectedEmails,
        projectName,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    setIsLoading(true);
    try {
      await tagMutation.mutateAsync({
        emailIds: selectedEmails,
        tag: tagInput,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">
            {selectedEmails.length} email(s) selecionado(s)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Marcar como Lido */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAsRead}
            disabled={isLoading}
            className="text-gray-700 hover:bg-blue-100"
          >
            <Mail className="w-4 h-4 mr-2" />
            Marcar como Lido
          </Button>

          {/* Reenviar */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleResend}
            disabled={isLoading}
            className="text-gray-700 hover:bg-blue-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reenviar
          </Button>

          {/* Exportar PDF */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={isLoading}
            className="text-gray-700 hover:bg-blue-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>

          {/* Adicionar Tag */}
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTagInput(!showTagInput)}
              disabled={isLoading}
              className="text-gray-700 hover:bg-blue-100"
            >
              <Tag className="w-4 h-4 mr-2" />
              Tag
            </Button>

            {showTagInput && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 w-48">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Nome da tag"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddTag}
                    disabled={isLoading || !tagInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    OK
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Deletar */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-700 hover:bg-red-100 border-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Deletar
          </Button>

          {/* Limpar Seleção */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            disabled={isLoading}
            className="text-gray-600 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {markAsReadMutation.isPending && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-700">
          <AlertCircle className="w-4 h-4" />
          Marcando como lido...
        </div>
      )}
      {resendMutation.isPending && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-700">
          <AlertCircle className="w-4 h-4" />
          Reenviando emails...
        </div>
      )}
      {deleteMutation.isPending && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          Deletando emails...
        </div>
      )}
      {exportMutation.isPending && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-700">
          <AlertCircle className="w-4 h-4" />
          Exportando PDF...
        </div>
      )}
    </Card>
  );
}
