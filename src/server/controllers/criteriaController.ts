import { Request, Response } from 'express';
import { ICriteria } from '../../types';

let criteriaList: ICriteria[] = [];

export const getCriteriaByEntry = (req: Request, res: Response) => {
  const { entryId } = req.params;
  const filtered = criteriaList.filter(c => c.entryId === entryId);
  res.json({ success: true, data: filtered });
};

export const createCriteria = (req: Request, res: Response) => {
  const { entryId, name, weight } = req.body;
  if (!entryId || !name) return res.status(400).json({ success: false, message: 'EntryId and name are required' });
  const newCriteria: ICriteria = { _id: Date.now().toString(), entryId, name, weight: weight || 0 };
  criteriaList.push(newCriteria);
  res.json({ success: true, data: newCriteria });
};

export const updateCriteria = (req: Request, res: Response) => {
  const { id } = req.params;
  const index = criteriaList.findIndex(c => c._id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Criteria not found' });
  criteriaList[index] = { ...criteriaList[index], ...req.body };
  res.json({ success: true, data: criteriaList[index] });
};

export const deleteCriteria = (req: Request, res: Response) => {
  const { id } = req.params;
  criteriaList = criteriaList.filter(c => c._id !== id);
  res.json({ success: true });
};
