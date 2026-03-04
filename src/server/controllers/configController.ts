import { Request, Response } from 'express';
import { IConfig, DamageLevel } from '../../types';

export const configs: IConfig[] = [
  { _id: '1', name: DamageLevel.SEVERELY_DAMAGE, value: 0 },
  { _id: '2', name: DamageLevel.MODERATELY_DAMAGE, value: 0.5 },
  { _id: '3', name: DamageLevel.SLIGHTLY_DAMAGE, value: 0.75 },
  { _id: '4', name: DamageLevel.NO_DAMAGE, value: 1 },
];

export const getAllConfigs = (req: Request, res: Response) => {
  res.json({ success: true, data: configs });
};
