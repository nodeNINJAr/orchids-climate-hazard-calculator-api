import { Request, Response } from 'express';
import { IEntry } from '../../types';

let entries: IEntry[] = [
  { _id: '1', division: 'Dhaka', climateHazardCategory: 'Flood' },
  { _id: '2', division: 'Chattogram', climateHazardCategory: 'Cyclon' },
  { _id: '3', division: 'Sylhet', climateHazardCategory: 'Flash Flood' },
];

export const getAllEntries = (req: Request, res: Response) => {
  res.json({ success: true, data: entries });
};

export const getEntriesByDivision = (req: Request, res: Response) => {
  const { division } = req.params;
  const filtered = entries.filter(e => e.division.toLowerCase() === division.toLowerCase());
  res.json({ success: true, data: filtered });
};

export const getEntryById = (req: Request, res: Response) => {
  const { id } = req.params;
  const entry = entries.find(e => e._id === id);
  if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
  // In a real DB, we would fetch criteria as well
  res.json({ success: true, data: { entry, criteria: [] } });
};

export const createEntry = (req: Request, res: Response) => {
  const { division, climateHazardCategory } = req.body;
  
  // Basic validation for Bangladeshi divisions
  const bdDivisions = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'];
  if (!bdDivisions.includes(division)) {
    // We'll allow it but maybe alert? For now just add it.
  }

  const newEntry: IEntry = { 
    _id: Date.now().toString(), 
    division, 
    climateHazardCategory 
  };
  entries.push(newEntry);
  res.json({ success: true, data: newEntry });
};

export const updateEntry = (req: Request, res: Response) => {
  const { id } = req.params;
  const index = entries.findIndex(e => e._id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Entry not found' });
  entries[index] = { ...entries[index], ...req.body };
  res.json({ success: true, data: entries[index] });
};

export const deleteEntry = (req: Request, res: Response) => {
  const { id } = req.params;
  entries = entries.filter(e => e._id !== id);
  res.json({ success: true });
};
