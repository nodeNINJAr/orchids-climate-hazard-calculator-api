'use client';

import { useEffect, useState } from 'react';
import { entryService, criteriaService, calculatorService, configService } from '../services/api';
import { IEntry, ICriteria, ICriteriaSelection, ICalculationResult, IConfig, BD_DIVISIONS } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function App() {
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [configs, setConfigs] = useState<IConfig[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [division, setDivision] = useState(BD_DIVISIONS[0]);
  const [climateHazardCategory, setClimateHazardCategory] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const [criteria, setCriteria] = useState<ICriteria[]>([]);
  const [criteriaName, setCriteriaName] = useState('');
  const [weight, setWeight] = useState<number>(0);
  const [editingCriteriaId, setEditingCriteriaId] = useState<string | null>(null);

  const [calculationResult, setCalculationResult] = useState<ICalculationResult | null>(null);
  const [viewAllDivisions, setViewAllDivisions] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadEntries = async () => {
    try {
      const res = await entryService.getAll();
      if (res.data.success) setEntries(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadConfigs = async () => {
    try {
      const res = await configService.getAll();
      if (res.data.success) {
        setConfigs(res.data.data);
        if (res.data.data.length > 0) {
          setWeight(res.data.data[0].value);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEntries();
    loadConfigs();
  }, []);

  const loadCriteria = async (entryId: string) => {
    try {
      const res = await criteriaService.getByEntry(entryId);
      if (res.data.success) setCriteria(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEntryChange = (entryId: string) => {
    setSelectedEntryId(entryId);
    setCalculationResult(null);
    setEditingEntryId(null);
    if (entryId) {
      loadCriteria(entryId);
      const entry = entries.find(e => e._id === entryId);
      if (entry) {
        setDivision(entry.division);
        setClimateHazardCategory(entry.climateHazardCategory);
      }
    }
  };

  const handleCreateOrUpdateEntry = async () => {
    if (!division || !climateHazardCategory) return alert('Division and Hazard Category are required');
    setLoading(true);
    try {
      if (editingEntryId) {
        const res = await entryService.update(editingEntryId, { division, climateHazardCategory });
        if (res.data.success) {
          setEntries(prev => prev.map(e => e._id === editingEntryId ? res.data.data : e));
          setEditingEntryId(null);
          setClimateHazardCategory('');
          alert('Entry Updated!');
        }
      } else {
        const res = await entryService.create({ division, climateHazardCategory });
        if (res.data.success) {
          const newEntry = res.data.data;
          setEntries(prev => [...prev, newEntry]);
          setClimateHazardCategory('');
          handleEntryChange(newEntry._id);
          alert('Entry Created!');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      const res = await entryService.delete(id);
      if (res.data.success) {
        setEntries(prev => prev.filter(e => e._id !== id));
        if (selectedEntryId === id) {
          setSelectedEntryId('');
          setCriteria([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOrUpdateCriteria = async () => {
    if (!selectedEntryId || !criteriaName) return alert('Select entry and enter criteria name');
    setLoading(true);
    try {
      if (editingCriteriaId) {
        const res = await criteriaService.update(editingCriteriaId, { name: criteriaName, weight });
        if (res.data.success) {
          setCriteria(prev => prev.map(c => c._id === editingCriteriaId ? res.data.data : c));
          setEditingCriteriaId(null);
          setCriteriaName('');
        }
      } else {
        const res = await criteriaService.create({
          name: criteriaName,
          weight,
          entryId: selectedEntryId,
        });
        if (res.data.success) {
          setCriteria(prev => [...prev, res.data.data]);
          setCriteriaName('');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCriteria = async (id: string) => {
    try {
      const res = await criteriaService.delete(id);
      if (res.data.success) {
        setCriteria(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCalculate = async () => {
    if (!selectedEntryId || criteria.length === 0) return alert('Add criteria first');

    const selections: ICriteriaSelection[] = criteria.map(c => ({
      criteriaId: c._id,
      value: c.weight
    }));

    try {
      const res = await calculatorService.calculate(selectedEntryId, selections);
      if (res.data.success) {
        setCalculationResult(res.data.data);
      } else {
        alert(res.data.message || 'Calculation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportToPDF = () => {
    if (!calculationResult || !selectedEntryId) return;
    const entry = entries.find(e => e._id === selectedEntryId);
    if (!entry) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Climate Hazard Calculation Report', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Division: ${entry.division}`, 14, 32);
    doc.text(`Hazard Category: ${entry.climateHazardCategory}`, 14, 40);
    
    autoTable(doc, {
      startY: 48,
      head: [['Criteria', 'Impact Weight']],
      body: criteria.map(c => {
        const config = configs.find(conf => conf.value === c.weight);
        return [c.name, config ? config.name : c.weight];
      }),
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text(`Total Score: ${calculationResult.totalScore.toFixed(2)}`, 14, finalY + 10);
    doc.text(`Average Score: ${calculationResult.averageScore.toFixed(2)}`, 14, finalY + 18);
    doc.text(`Risk Level: ${calculationResult.riskLevel}`, 14, finalY + 26);

    doc.save(`${entry.division}_${entry.climateHazardCategory}_report.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800">Climate Hazard Calculator</h1>
        <button 
          onClick={() => setViewAllDivisions(!viewAllDivisions)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors shadow"
        >
          {viewAllDivisions ? '← Back to Calculator' : 'View All Divisions →'}
        </button>
      </div>

      {!viewAllDivisions ? (
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Entry Management */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-bold mb-4 text-gray-700">
                {editingEntryId ? 'Update Entry' : 'Create New Entry'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Division</label>
                  <select
                    className="border p-2 rounded w-full bg-white font-semibold"
                    value={division}
                    onChange={e => setDivision(e.target.value)}
                  >
                    {BD_DIVISIONS.map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Hazard Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Flood, Landslide"
                    value={climateHazardCategory}
                    onChange={e => setClimateHazardCategory(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateOrUpdateEntry}
                    disabled={loading}
                    className={`flex-1 ${editingEntryId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-purple-600 hover:bg-purple-700'} text-white px-4 py-2 rounded transition-colors font-medium`}
                  >
                    {editingEntryId ? 'Update' : 'Create Entry'}
                  </button>
                  {editingEntryId && (
                    <button
                      onClick={() => {
                        setEditingEntryId(null);
                        setClimateHazardCategory('');
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-bold mb-4 text-gray-700">All Entries</h2>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {entries.length > 0 ? (
                  entries.map(entry => (
                    <div 
                      key={entry._id} 
                      className={`p-3 rounded border flex justify-between items-center cursor-pointer transition-colors ${selectedEntryId === entry._id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                      onClick={() => handleEntryChange(entry._id)}
                    >
                      <div>
                        <p className="font-bold text-gray-800">{entry.climateHazardCategory}</p>
                        <p className="text-xs text-gray-500">{entry.division}</p>
                      </div>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => {
                            setEditingEntryId(entry._id);
                            setDivision(entry.division);
                            setClimateHazardCategory(entry.climateHazardCategory);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          ✎
                        </button>
                        <button 
                          onClick={() => handleDeleteEntry(entry._id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic text-center py-4">No entries yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Criteria & Results */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedEntryId ? (
              <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
                <p className="text-gray-500 text-lg">Select an entry from the list to manage criteria and calculate risk.</p>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {entries.find(e => e._id === selectedEntryId)?.climateHazardCategory} In {entries.find(e => e._id === selectedEntryId)?.division}
                    </h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase">Selected</span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border mb-6">
                    <h3 className="font-bold mb-3 text-gray-700">{editingCriteriaId ? 'Update Criteria' : 'Add Criteria'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Criteria Name"
                        value={criteriaName}
                        onChange={e => setCriteriaName(e.target.value)}
                        className="border p-2 rounded col-span-1"
                      />
                      <select
                        className="border p-2 rounded bg-white"
                        value={weight}
                        onChange={e => setWeight(Number(e.target.value))}
                      >
                        {configs.map(config => (
                          <option key={config._id} value={config.value}>
                            {config.name} ({config.value})
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddOrUpdateCriteria}
                          disabled={loading}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex-1"
                        >
                          {editingCriteriaId ? 'Update' : 'Add'}
                        </button>
                        {editingCriteriaId && (
                          <button
                            onClick={() => {
                              setEditingCriteriaId(null);
                              setCriteriaName('');
                            }}
                            className="bg-gray-200 px-3 py-2 rounded"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-700 flex justify-between items-center">
                      Assigned Criteria 
                      <span className="text-xs font-normal text-gray-500">{criteria.length} items</span>
                    </h3>
                    <div className="border rounded divide-y">
                      {criteria.length > 0 ? (
                        criteria.map(c => (
                          <div key={c._id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                            <div>
                              <span className="font-medium">{c.name}</span>
                              <span className="ml-3 text-sm text-gray-500">
                                Weight: {configs.find(conf => conf.value === c.weight)?.name || c.weight}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setEditingCriteriaId(c._id);
                                  setCriteriaName(c.name);
                                  setWeight(c.weight);
                                }}
                                className="text-blue-500 text-sm hover:underline"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteCriteria(c._id)}
                                className="text-red-500 text-sm hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-gray-400 italic">No criteria added for this entry.</div>
                      )}
                    </div>
                  </div>

                  {criteria.length > 0 && (
                    <button
                      onClick={handleCalculate}
                      className="mt-8 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full font-bold shadow-md"
                    >
                      Calculate Hazard Risk
                    </button>
                  )}
                </div>

                {calculationResult && (
                  <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-green-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                      <div className={`px-4 py-1 rounded-bl-lg font-bold uppercase text-sm ${
                        calculationResult.riskLevel === 'High' ? 'bg-red-500 text-white' :
                        calculationResult.riskLevel === 'Medium' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {calculationResult.riskLevel} Risk
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Assessment Result</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg border text-center">
                        <p className="text-gray-500 text-sm uppercase font-semibold">Total Score</p>
                        <p className="text-3xl font-bold text-gray-800">{calculationResult.totalScore.toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border text-center">
                        <p className="text-gray-500 text-sm uppercase font-semibold">Average Impact</p>
                        <p className="text-3xl font-bold text-gray-800">{calculationResult.averageScore.toFixed(2)}</p>
                      </div>
                    </div>

                    <button 
                      onClick={exportToPDF}
                      className="w-full bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                    >
                      📥 Download PDF Report
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">All Bangladesh Divisions - Hazards Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BD_DIVISIONS.map(div => {
              const divisionEntries = entries.filter(e => e.division === div);
              return (
                <div key={div} className="bg-white p-5 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold border-b pb-2 mb-3 text-blue-800 flex justify-between items-center">
                    {div}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{divisionEntries.length}</span>
                  </h3>
                  {divisionEntries.length > 0 ? (
                    <ul className="space-y-2">
                      {divisionEntries.map(entry => (
                        <li key={entry._id} className="text-sm flex items-center gap-2 cursor-pointer hover:text-blue-600" onClick={() => {
                          setViewAllDivisions(false);
                          handleEntryChange(entry._id);
                        }}>
                          <span className="text-blue-400">•</span>
                          {entry.climateHazardCategory}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic py-2">No data recorded</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
