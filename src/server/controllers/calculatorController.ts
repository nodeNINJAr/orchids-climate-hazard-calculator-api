import { Request, Response } from 'express';
import { ICalculationResult } from '../../types';

let calculations: ICalculationResult[] = [];

export const calculateHazard = (req: Request, res: Response) => {
  const { entryId, criteriaSelections } = req.body;
  if (!entryId || !criteriaSelections || !Array.isArray(criteriaSelections)) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  const totalScore = criteriaSelections.reduce((sum, s) => sum + (s.value || 0), 0);
  const averageScore = criteriaSelections.length > 0 ? totalScore / criteriaSelections.length : 0;
  
  let riskLevel = 'Low';
  if (averageScore <= 0.33) riskLevel = 'High';
  else if (averageScore <= 0.66) riskLevel = 'Medium';

  const result: ICalculationResult = { totalScore, averageScore, riskLevel };
  calculations.push(result);
  res.json({ success: true, data: result });
};

export const generatePDF = (req: Request, res: Response) => {
  // In a real server-side PDF generation, we would return a buffer or a link.
  // For this environment, we will handle PDF generation on the frontend using jspdf.
  res.json({ success: true, message: 'PDF requested' });
};

export const getCalculationHistory = (req: Request, res: Response) => {
  res.json({ success: true, data: calculations });
};

export const getCalculationById = (req: Request, res: Response) => {
  const { id } = req.params;
  const result = calculations.find((_, idx) => idx.toString() === id);
  if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
  res.json({ success: true, data: result });
};
