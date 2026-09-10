export interface LeadData {
  $id?: string;
  name: string;
  whatsapp: string;
  service_type: string;
  daily_volume?: string;
  status: 'pendente_avaliacao' | 'em_analise' | 'aprovado' | 'prospectado';
  created_at: string;
  notes?: string;
}

export interface ApplicationFormData {
  fullNameAndRole: string;
  whatsappContact: string;
  companyAndSector: string;
  dailyVolume: string;
  currentToolOrApi: string;
  mainBottleneckOrPain: string;
}

export type VolumeOption = 
  | 'Menos de 100 / dia'
  | '100 a 500 / dia'
  | '500 a 2.000 / dia'
  | 'Mais de 2.000 / dia';

export interface BenefitItem {
  id: string;
  title: string;
  description: string;
  highlight: string;
  metric: string;
}

export interface BetaStepItem {
  step: number;
  title: string;
  description: string;
  badge: string;
}
