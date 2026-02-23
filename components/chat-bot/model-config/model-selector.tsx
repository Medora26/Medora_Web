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
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-openai" viewBox="0 0 16 16">
  <path d="M14.949 6.547a3.94 3.94 0 0 0-.348-3.273 4.11 4.11 0 0 0-4.4-1.934A4.1 4.1 0 0 0 8.423.2 4.15 4.15 0 0 0 6.305.086a4.1 4.1 0 0 0-1.891.948 4.04 4.04 0 0 0-1.158 1.753 4.1 4.1 0 0 0-1.563.679A4 4 0 0 0 .554 4.72a3.99 3.99 0 0 0 .502 4.731 3.94 3.94 0 0 0 .346 3.274 4.11 4.11 0 0 0 4.402 1.933c.382.425.852.764 1.377.995.526.231 1.095.35 1.67.346 1.78.002 3.358-1.132 3.901-2.804a4.1 4.1 0 0 0 1.563-.68 4 4 0 0 0 1.14-1.253 3.99 3.99 0 0 0-.506-4.716m-6.097 8.406a3.05 3.05 0 0 1-1.945-.694l.096-.054 3.23-1.838a.53.53 0 0 0 .265-.455v-4.49l1.366.778q.02.011.025.035v3.722c-.003 1.653-1.361 2.992-3.037 2.996m-6.53-2.75a2.95 2.95 0 0 1-.36-2.01l.095.057L5.29 12.09a.53.53 0 0 0 .527 0l3.949-2.246v1.555a.05.05 0 0 1-.022.041L6.473 13.3c-1.454.826-3.311.335-4.15-1.098m-.85-6.94A3.02 3.02 0 0 1 3.07 3.949v3.785a.51.51 0 0 0 .262.451l3.93 2.237-1.366.779a.05.05 0 0 1-.048 0L2.585 9.342a2.98 2.98 0 0 1-1.113-4.094zm11.216 2.571L8.747 5.576l1.362-.776a.05.05 0 0 1 .048 0l3.265 1.86a3 3 0 0 1 1.173 1.207 2.96 2.96 0 0 1-.27 3.2 3.05 3.05 0 0 1-1.36.997V8.279a.52.52 0 0 0-.276-.445m1.36-2.015-.097-.057-3.226-1.855a.53.53 0 0 0-.53 0L6.249 6.153V4.598a.04.04 0 0 1 .019-.04L9.533 2.7a3.07 3.07 0 0 1 3.257.139c.474.325.843.778 1.066 1.303.223.526.289 1.103.191 1.664zM5.503 8.575 4.139 7.8a.05.05 0 0 1-.026-.037V4.049c0-.57.166-1.127.476-1.607s.752-.864 1.275-1.105a3.08 3.08 0 0 1 3.234.41l-.096.054-3.23 1.838a.53.53 0 0 0-.265.455zm.742-1.577 1.758-1 1.762 1v2l-1.755 1-1.762-1z"/>
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
          <Button variant="outline" className="justify-between">
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
        
        <DropdownMenuContent
         align='end'
        className=" overflow-y-auto">
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