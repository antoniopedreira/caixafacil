import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import FlavioAvatar, { FLAVIO_AVATARS } from './FlavioAvatar';

export default function AvatarSelector({ open, onClose, onSelectAvatar, currentAvatar }) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || 'avatar1');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onSelectAvatar(selectedAvatar);
      // O onClose será chamado automaticamente no parent após salvar
    } catch (error) {
      console.error('Error selecting avatar:', error);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isLoading && onClose(isOpen)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Escolha o Avatar do Flávio</DialogTitle>
          <DialogDescription>
            Selecione qual versão do consultor Flávio você prefere para suas conversas
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          {Object.values(FLAVIO_AVATARS).map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => !isLoading && setSelectedAvatar(avatar.id)}
              disabled={isLoading}
              className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                selectedAvatar === avatar.id
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-slate-200 bg-white hover:border-purple-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedAvatar === avatar.id && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className="flex flex-col items-center space-y-3">
                <FlavioAvatar avatarId={avatar.id} size="xxl" />
                <div className="text-center">
                  <h3 className="font-bold text-slate-900">{avatar.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{avatar.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              'Confirmar Escolha'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}