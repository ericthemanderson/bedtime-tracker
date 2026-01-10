import React, { useState, useEffect } from 'react';
import { Clock, Edit3, Play, RotateCcw, Plus, X, Trophy, Gift, Trash2, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function BedtimeTracker() {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [editMode, setEditMode] = useState(false);
  
  const [kids, setKids] = useState(['Emma', 'Liam']);
  const [tasks, setTasks] = useState(['Brush Teeth', 'Pajamas', 'Story Time', 'Lights Out']);
  const [completions, setCompletions] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  
  const [dailyRecords, setDailyRecords] = useState([]);
  const [points, setPoints] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [showSpendPoints, setShowSpendPoints] = useState(false);
  const [selectedKid, setSelectedKid] = useState('');
  const [pointsToSpend, setPointsToSpend] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  
  const [newKidName, setNewKidName] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [editingKid, setEditingKid] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const startStopwatch = () => {
    setStartTime(Date.now() - elapsedTime);
    setIsRunning(true);
    setShowSummary(false);
  };

  const resetStopwatch = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    setCompletions({});
    setShowSummary(false);
  };

  const handleTaskComplete = (kid, task) => {
    if (!isRunning) return;
    
    const currentTime = Date.now() - startTime;
    const key = `${kid}-${task}`;
    
    if (completions[key]) return;
    
    // Find most recent completed task for this kid
    const kidCompletions = Object.entries(completions)
      .filter(([k]) => k.startsWith(`${kid}-`))
      .sort((a, b) => b[1].absoluteTime - a[1].absoluteTime);
    
    let lapTime = currentTime;
    if (kidCompletions.length > 0) {
      lapTime = currentTime - kidCompletions[0][1].absoluteTime;
    }
    
    const newCompletions = {
      ...completions,
      [key]: { absoluteTime: currentTime, lapTime }
    };
    
    setCompletions(newCompletions);
    
    // Check if all tasks are complete
    const totalTasks = kids.length * tasks.length;
    if (Object.keys(newCompletions).length === totalTasks) {
      setIsRunning(false);
      finishRoutine(newCompletions);
    }
  };

  const finishRoutine = (finalCompletions) => {
    // Calculate points for each task
    const taskPoints = {};
    tasks.forEach(task => {
      let fastestKid = null;
      let fastestTime = Infinity;
      
      kids.forEach(kid => {
        const key = `${kid}-${task}`;
        if (finalCompletions[key] && finalCompletions[key].lapTime < fastestTime) {
          fastestTime = finalCompletions[key].lapTime;
          fastestKid = kid;
        }
      });
      
      if (fastestKid) {
        taskPoints[fastestKid] = (taskPoints[fastestKid] || 0) + 1;
      }
    });

    // Update total points
    const newPoints = { ...points };
    Object.keys(taskPoints).forEach(kid => {
      newPoints[kid] = (newPoints[kid] || 0) + taskPoints[kid];
    });
    setPoints(newPoints);

    // Save daily record
    const record = {
      date: new Date().toISOString(),
      completions: finalCompletions,
      kids: [...kids],
      tasks: [...tasks],
      taskPoints
    };
    setDailyRecords([record, ...dailyRecords]);
    setShowSummary(true);
  };

  const deleteRecord = (index) => {
    const record = dailyRecords[index];
    // Deduct points
    const newPoints = { ...points };
    Object.entries(record.taskPoints || {}).forEach(([kid, pts]) => {
      newPoints[kid] = (newPoints[kid] || 0) - pts;
    });
    setPoints(newPoints);
    setDailyRecords(dailyRecords.filter((_, i) => i !== index));
  };

  const spendPoints = () => {
    const amount = parseInt(pointsToSpend);
    if (!selectedKid || !amount || amount <= 0 || amount > (points[selectedKid] || 0)) return;
    
    const newPoints = { ...points };
    newPoints[selectedKid] -= amount;
    setPoints(newPoints);
    
    setSelectedKid('');
    setPointsToSpend('');
    setPrizeDescription('');
    setShowSpendPoints(false);
  };

  const addKid = () => {
    if (newKidName.trim()) {
      setKids([...kids, newKidName.trim()]);
      setNewKidName('');
    }
  };

  const addTask = () => {
    if (newTaskName.trim()) {
      setTasks([...tasks, newTaskName.trim()]);
      setNewTaskName('');
    }
  };

  const removeKid = (index) => {
    setKids(kids.filter((_, i) => i !== index));
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const renameKid = (index, newName) => {
    const newKids = [...kids];
    newKids[index] = newName;
    setKids(newKids);
    setEditingKid(null);
  };

  const renameTask = (index, newName) => {
    const newTasks = [...tasks];
    newTasks[index] = newName;
    setTasks(newTasks);
    setEditingTask(null);
  };

  const getChartData = () => {
    const data = [];
    
    tasks.forEach((task, idx) => {
      const dataPoint = { task: task, taskNum: idx + 1 };
      
      kids.forEach(kid => {
        const key = `${kid}-${task}`;
        if (completions[key]) {
          dataPoint[kid] = completions[key].absoluteTime / 1000; // Convert to seconds
        }
      });
      
      data.push(dataPoint);
    });
    
    return data;
  };

  const calculateSummary = () => {
    const kidTimes = {};
    const taskWinners = {};
    const taskPoints = {};
    
    kids.forEach(kid => {
      const kidCompletions = Object.entries(completions)
        .filter(([k]) => k.startsWith(`${kid}-`))
        .sort((a, b) => b[1].absoluteTime - a[1].absoluteTime);
      
      if (kidCompletions.length > 0) {
        kidTimes[kid] = kidCompletions[0][1].absoluteTime;
      }
    });
    
    tasks.forEach(task => {
      let fastestKid = null;
      let fastestTime = Infinity;
      
      kids.forEach(kid => {
        const key = `${kid}-${task}`;
        if (completions[key] && completions[key].lapTime < fastestTime) {
          fastestTime = completions[key].lapTime;
          fastestKid = kid;
        }
      });
      
      if (fastestKid) {
        taskWinners[task] = { kid: fastestKid, time: fastestTime };
        taskPoints[fastestKid] = (taskPoints[fastestKid] || 0) + 1;
      }
    });
    
    const overallWinner = Object.entries(kidTimes).reduce((fastest, [kid, time]) => {
      return !fastest || time < fastest.time ? { kid, time } : fastest;
    }, null);
    
    return { kidTimes, taskWinners, overallWinner, taskPoints };
  };

  const summary = showSummary ? calculateSummary() : null;
  const chartData = Object.keys(completions).length > 0 ? getChartData() : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-3xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-indigo-900 flex items-center gap-2">
              <Clock className="w-8 h-8" />
              Bedtime Tracker
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-3 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`p-3 rounded-full transition-colors ${
                  editMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
                }`}
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Stopwatch */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
            <div className="text-6xl font-mono font-bold text-center mb-4">
              {formatTime(elapsedTime)}
            </div>
            <div className="flex gap-3 justify-center">
              {!isRunning && elapsedTime === 0 && (
                <button
                  onClick={startStopwatch}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-indigo-50 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Start Bedtime
                </button>
              )}
              {(isRunning || elapsedTime > 0) && (
                <button
                  onClick={resetStopwatch}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-indigo-50 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Points Display */}
        <div className="bg-white shadow-lg p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Points Leaderboard
            </h2>
            <button
              onClick={() => setShowSpendPoints(!showSpendPoints)}
              className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-green-600 transition-colors"
            >
              <Gift className="w-4 h-4" />
              Spend Points
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            {kids.map((kid, idx) => (
              <div key={kid} className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg p-3 text-white text-center">
                <div className="font-bold text-lg">{kid}</div>
                <div className="text-3xl font-bold">{points[kid] || 0}</div>
                <div className="text-sm opacity-90">points</div>
              </div>
            ))}
          </div>
        </div>

        {/* Spend Points Modal */}
        {showSpendPoints && (
          <div className="bg-white shadow-lg p-4 border-t-2 border-green-500">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Spend Points on Prize</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kid</label>
                <select 
                  value={selectedKid} 
                  onChange={(e) => setSelectedKid(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select a kid</option>
                  {kids.map(kid => (
                    <option key={kid} value={kid}>{kid} ({points[kid] || 0} points)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Points to Spend</label>
                <input
                  type="number"
                  value={pointsToSpend}
                  onChange={(e) => setPointsToSpend(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter points"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Prize (optional)</label>
                <input
                  type="text"
                  value={prizeDescription}
                  onChange={(e) => setPrizeDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Extra story, Stay up 15 min later"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={spendPoints}
                  disabled={!selectedKid || !pointsToSpend || parseInt(pointsToSpend) > (points[selectedKid] || 0)}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Redeem
                </button>
                <button
                  onClick={() => setShowSpendPoints(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {showHistory && (
          <div className="bg-white shadow-lg p-4 border-t-2 border-purple-500 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Previous Bedtimes</h3>
            {dailyRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No previous records</p>
            ) : (
              <div className="space-y-2">
                {dailyRecords.map((record, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Points earned: {Object.entries(record.taskPoints || {}).map(([kid, pts]) => `${kid}: ${pts}`).join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteRecord(idx)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Task Table */}
        <div className="bg-white shadow-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-indigo-50">
                <th className="p-4 text-left font-bold text-indigo-900 border-r border-indigo-200">
                  Tasks
                </th>
                {kids.map((kid, i) => (
                  <th key={i} className="p-4 text-center font-bold text-indigo-900 border-r border-indigo-200">
                    {editMode && editingKid === i ? (
                      <input
                        type="text"
                        defaultValue={kid}
                        autoFocus
                        onBlur={(e) => renameKid(i, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && renameKid(i, e.target.value)}
                        className="w-full px-2 py-1 border rounded text-center"
                      />
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span onClick={() => editMode && setEditingKid(i)} className="cursor-pointer">
                          {kid}
                        </span>
                        {editMode && (
                          <button onClick={() => removeKid(i)} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </th>
                ))}
                {editMode && (
                  <th className="p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="New kid"
                        value={newKidName}
                        onChange={(e) => setNewKidName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addKid()}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <button onClick={addKid} className="bg-indigo-500 text-white p-1 rounded">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, taskIdx) => (
                <tr key={taskIdx} className="border-t border-indigo-100">
                  <td className="p-4 font-semibold text-indigo-900 border-r border-indigo-200">
                    {editMode && editingTask === taskIdx ? (
                      <input
                        type="text"
                        defaultValue={task}
                        autoFocus
                        onBlur={(e) => renameTask(taskIdx, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && renameTask(taskIdx, e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span onClick={() => editMode && setEditingTask(taskIdx)} className="cursor-pointer">
                          {task}
                        </span>
                        {editMode && (
                          <button onClick={() => removeTask(taskIdx)} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  {kids.map((kid, kidIdx) => {
                    const key = `${kid}-${task}`;
                    const completion = completions[key];
                    return (
                      <td key={kidIdx} className="p-2 text-center border-r border-indigo-100">
                        <button
                          onClick={() => handleTaskComplete(kid, task)}
                          disabled={!isRunning || !!completion}
                          className={`w-full py-3 px-2 rounded-lg font-mono text-sm transition-all ${
                            completion
                              ? 'bg-green-500 text-white'
                              : isRunning
                              ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {completion ? formatTime(completion.lapTime) : '—'}
                        </button>
                      </td>
                    );
                  })}
                  {editMode && <td></td>}
                </tr>
              ))}
              {editMode && (
                <tr className="border-t border-indigo-200">
                  <td className="p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="New task"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                        className="px-2 py-1 border rounded text-sm flex-1"
                      />
                      <button onClick={addTask} className="bg-indigo-500 text-white p-1 rounded">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Progress Chart */}
        {chartData.length > 0 && (
          <div className="bg-white shadow-lg p-6">
            <h3 className="text-xl font-bold text-indigo-900 mb-4">Progress Chart</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="task" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {kids.map((kid, idx) => (
                  <Line 
                    key={kid} 
                    type="monotone" 
                    dataKey={kid} 
                    stroke={colors[idx % colors.length]} 
                    strokeWidth={2}
                    dot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary */}
        {showSummary && summary && (
          <div className="bg-white rounded-b-3xl shadow-lg p-6">
            <div className="text-center mb-6">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-indigo-900">Bedtime Complete! 🌙</h2>
            </div>
            
            {summary.overallWinner && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 mb-4 text-center">
                <div className="text-white">
                  <div className="text-lg font-semibold">Overall Fastest</div>
                  <div className="text-3xl font-bold">{summary.overallWinner.kid}</div>
                  <div className="text-xl">{formatTime(summary.overallWinner.time)}</div>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="font-bold text-indigo-900 text-lg mb-2">Points Earned Tonight:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {kids.map(kid => (
                  <div key={kid} className="bg-indigo-50 rounded-lg p-3 text-center">
                    <div className="font-bold text-indigo-900">{kid}</div>
                    <div className="text-2xl font-bold text-indigo-600">+{summary.taskPoints[kid] || 0}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-indigo-900 text-lg">Task Winners (1 point each):</h3>
              {Object.entries(summary.taskWinners).map(([task, winner]) => (
                <div key={task} className="bg-indigo-50 rounded-lg p-3 flex justify-between items-center">
                  <span className="font-semibold text-indigo-900">{task}</span>
                  <div className="text-right">
                    <div className="font-bold text-indigo-700">{winner.kid}</div>
                    <div className="text-sm text-indigo-600">{formatTime(winner.time)}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 space-y-2">
              <h3 className="font-bold text-indigo-900 text-lg">All Times:</h3>
              {kids.map(kid => (
                <div key={kid} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                  <span className="font-semibold text-gray-800">{kid}</span>
                  <span className="font-mono text-gray-700">
                    {summary.kidTimes[kid] ? formatTime(summary.kidTimes[kid]) : 'Incomplete'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}