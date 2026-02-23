// components/ModelSelector.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Zap, 
  Cpu,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  availableModels, 
  getProductionModels,
  getTierBadgeColor,
  getTierDisplay,
  DEFAULT_MODEL,
  type ModelInfo 
} from '@/lib/ai/model-config';

interface ModelSelectorProps {
  onModelChange?: (modelId: string) => void;
  initialModel?: string;
}

// OpenAI Icon Component
const OpenAIIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.9847 5.9847 0 0 0 .5157 4.9108 6.0462 6.0462 0 0 0 6.5098 2.9 6.0651 6.0651 0 0 0 4.4947-2.1818 5.9847 5.9847 0 0 0 3.9977-2.9 6.0462 6.0462 0 0 0-.7427-7.0966zM12 20.3631c-3.5142 0-6.3631-2.849-6.3631-6.3631 0-3.5142 2.849-6.3631 6.3631-6.3631 3.5142 0 6.3631 2.849 6.3631 6.3631 0 3.5142-2.849 6.3631-6.3631 6.3631z" />
  </svg>
);

export function ModelSelector({ onModelChange, initialModel = DEFAULT_MODEL }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<ModelInfo>(
    availableModels.find(m => m.id === initialModel) || availableModels[0]
  );

  const productionModels = getProductionModels();

  const handleModelSelect = (model: ModelInfo) => {
    setSelectedModel(model);
    if (onModelChange) {
      onModelChange(model.id);
    }
    localStorage.setItem('selectedModel', model.id);
  };

  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) {
      const model = availableModels.find(m => m.id === savedModel);
      if (model) {
        setSelectedModel(model);
        if (onModelChange) {
          onModelChange(model.id);
        }
      }
    }
  }, [onModelChange]);

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[260px] justify-between">
            <div className="flex items-center gap-2 truncate">
              <OpenAIIcon />
              <span className="font-medium truncate">{selectedModel.name}</span>
              <Badge 
                variant="outline" 
                className={getTierBadgeColor(selectedModel.tier)}
              >
                {getTierDisplay(selectedModel.tier)}
              </Badge>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-[350px] max-h-[500px] overflow-y-auto">
          <DropdownMenuLabel>OpenAI Models</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {productionModels.map((model) => (
            <DropdownMenuItem
              key={model.id}
              className={`flex flex-col items-start p-3 cursor-pointer ${
                selectedModel.id === model.id ? 'bg-muted' : ''
              }`}
              onClick={() => handleModelSelect(model)}
            >
              <div className="flex w-full justify-between items-center">
                <div className="flex items-center gap-2">
                  <OpenAIIcon />
                  <span className="font-semibold">{model.name}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={getTierBadgeColor(model.tier)}
                >
                  {getTierDisplay(model.tier)}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                {model.description}
              </p>
              
              <div className="flex gap-3 mt-2 text-xs">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Cpu className="h-3 w-3" />
                      <span>{model.contextWindow}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Context window size</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      <span>{model.rateLimit}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Rate limit</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{model.bestFor}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Best suited for: {model.bestFor}</p>
                  </TooltipContent>
                </Tooltip>

                {model.costPer1kTokens && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>${model.costPer1kTokens.input}/${model.costPer1kTokens.output}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Cost per 1K tokens (input/output)</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <div className="p-3 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3 flex-shrink-0" />
              <span>OpenAI models are paid. Set up billing in OpenAI dashboard.</span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}