import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const seizureTypes = {
  focal_aware: {
    name: "Focal Aware Seizure",
    description: "You remain conscious but may experience unusual sensations, movements, or feelings. May include jerking movements, tingling, dizziness, or seeing flashing lights.",
    symptoms: ["Déjà vu feelings", "Unusual tastes or smells", "Tingling sensations", "Sudden emotions", "Stiffening of muscles"]
  },
  focal_impaired_awareness: {
    name: "Focal Impaired Awareness",
    description: "Consciousness is affected. You may stare blankly, not respond normally, or make repetitive movements like lip smacking or hand rubbing.",
    symptoms: ["Blank staring", "Unresponsive to surroundings", "Repetitive movements", "Confusion during and after", "Automatic behaviors"]
  },
  focal_to_bilateral_tonic_clonic: {
    name: "Focal to Bilateral Tonic-Clonic",
    description: "Starts in one area of the brain (focal) then spreads to both sides, causing stiffening (tonic) followed by jerking (clonic) movements.",
    symptoms: ["Starts with focal symptoms", "Loss of consciousness", "Body stiffening", "Rhythmic jerking", "May bite tongue or lose bladder control"]
  },
  generalized_absence: {
    name: "Absence Seizure",
    description: "Brief episodes of staring into space or subtle body movements. Often lasts only a few seconds and may go unnoticed.",
    symptoms: ["Brief staring spells", "Subtle lip smacking", "Eyelid fluttering", "No memory of episode", "Quick return to normal"]
  },
  generalized_tonic_clonic: {
    name: "Tonic-Clonic (Grand Mal)",
    description: "The most recognized type. Involves loss of consciousness, body stiffening, followed by rhythmic jerking movements.",
    symptoms: ["Sudden loss of consciousness", "Body stiffening (tonic phase)", "Rhythmic jerking (clonic phase)", "May cry out at onset", "Post-seizure confusion and fatigue"]
  },
  generalized_tonic: {
    name: "Tonic Seizure",
    description: "Muscles suddenly stiffen, especially in the back, legs, and arms. May cause falls if standing.",
    symptoms: ["Sudden muscle stiffening", "May fall if standing", "Brief duration (usually under 20 seconds)", "May affect consciousness"]
  },
  generalized_clonic: {
    name: "Clonic Seizure",
    description: "Repeated jerking muscle movements affecting both sides of the body.",
    symptoms: ["Rhythmic jerking movements", "Affects both sides of body", "Neck, face, and arms often involved", "Rare type of seizure"]
  },
  generalized_myoclonic: {
    name: "Myoclonic Seizure",
    description: "Quick, brief jerks or twitches of muscles or groups of muscles. Often occurs shortly after waking.",
    symptoms: ["Quick muscle jerks", "Usually affects arms and legs", "Very brief (1-2 seconds)", "May occur in clusters", "Often happens in morning"]
  },
  generalized_atonic: {
    name: "Atonic (Drop) Seizure",
    description: "Muscles suddenly go limp, causing falls or head drops. Also called 'drop attacks.'",
    symptoms: ["Sudden loss of muscle tone", "May cause falls", "Head may drop suddenly", "Brief duration", "Risk of injury from falling"]
  },
  unknown: {
    name: "Unknown/Unclassified",
    description: "When the seizure type cannot be clearly determined based on available information.",
    symptoms: ["Symptoms may vary", "Requires further evaluation", "Document all observations"]
  }
};

export const getSeizureTypeInfo = (type) => seizureTypes[type] || seizureTypes.unknown;

export default function SeizureTypeInfo({ type, showFull = false }) {
  const info = getSeizureTypeInfo(type);
  
  if (showFull) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-indigo-100">
        <h4 className="font-semibold text-indigo-900 text-base md:text-lg mb-2">{info.name}</h4>
        <p className="text-slate-600 text-sm mb-3 md:mb-4 leading-relaxed">{info.description}</p>
        <div>
          <p className="text-xs font-medium text-indigo-700 mb-2 uppercase tracking-wide">Common Signs:</p>
          <ul className="space-y-1">
            {info.symptoms.map((symptom, idx) => (
              <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></span>
                {symptom}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors">
            <Info className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3 bg-white shadow-xl border border-slate-100">
          <p className="font-medium text-slate-900 mb-1">{info.name}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { seizureTypes };