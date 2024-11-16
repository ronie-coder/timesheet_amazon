import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion } from 'framer-motion';

function App() {
  const [date, setDate] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [punchInTime, setPunchInTime] = useState('');
  const [punchOutTime, setPunchOutTime] = useState('');
  const [comment, setComment] = useState('');
  const [dailyData, setDailyData] = useState([]);
  const [hoverDetails, setHoverDetails] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const workStartTime = "10:00";
  const workEndTime = "19:00";

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('timesheetData')) || [];
    setDailyData(savedData);
  }, []);

  const saveData = (newData) => {
    setDailyData(newData);
    localStorage.setItem('timesheetData', JSON.stringify(newData));
  };

  const handleSaveEntry = () => {
    if (punchInTime && punchOutTime && comment.trim()) {
      const entryDate = date.toISOString().split('T')[0];
      const newEntry = { entryDate, punchInTime, punchOutTime, comment };

      const updatedData = [...dailyData, newEntry];
      saveData(updatedData);
      setPunchInTime('');
      setPunchOutTime('');
      setComment('');
      setPopupOpen(false);
    }
  };

  const isWithinWorkHours = (punchInTime, punchOutTime) => {
    const punchIn = new Date(`1970-01-01T${punchInTime}:00`);
    const punchOut = new Date(`1970-01-01T${punchOutTime}:00`);
    const startWork = new Date(`1970-01-01T${workStartTime}:00`);
    const endWork = new Date(`1970-01-01T${workEndTime}:00`);

    return punchIn >= startWork && punchOut <= endWork;
  };

  const calculateOvertime = (punchInTime, punchOutTime) => {
    const punchIn = new Date(`1970-01-01T${punchInTime}:00`);
    const punchOut = new Date(`1970-01-01T${punchOutTime}:00`);
    const regularWorkHours = 9 * 60 * 60 * 1000; // 9 hours in milliseconds

    const workedHours = punchOut - punchIn;
    if (workedHours > regularWorkHours) {
      const overtime = workedHours - regularWorkHours;
      return overtime / (1000 * 60 * 60); // Convert milliseconds to hours
    }
    return 0; // No overtime
  };

  const calculateTotalOvertimeForMonth = () => {
    const selectedMonthData = dailyData.filter(entry => {
      const entryDate = new Date(entry.entryDate);
      return entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
    });
    return selectedMonthData.reduce((totalOvertime, entry) => {
      return totalOvertime + calculateOvertime(entry.punchInTime, entry.punchOutTime);
    }, 0);
  };

  const getCommentsForDate = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    return dailyData.filter(entry => entry.entryDate === formattedDate)
      .map(entry => `${entry.punchInTime} - ${entry.punchOutTime}: ${entry.comment}`).join(", ");
  };

  const getTileClassName = (date) => {
    const entry = dailyData.find((entry) => entry.entryDate === date.toISOString().split('T')[0]);

    if (entry) {
      const { punchInTime, punchOutTime } = entry;
      return isWithinWorkHours(punchInTime, punchOutTime) ? 'bg-green-300' : 'bg-red-300';
    }
    return ''; // Default case, no entry for this date
  };

  const handleMouseEnter = (e, date) => {
    const comments = getCommentsForDate(date);
    if (comments) {
      const rect = e.target.getBoundingClientRect();
      setHoverDetails({
        text: comments,
        position: { left: rect.left + window.scrollX, top: rect.top + window.scrollY + rect.height }
      });
    }
  };

  const handleMouseLeave = () => {
    setHoverDetails(null);
  };

  const handleDateClick = (value) => {
    setDate(value);
    setPopupOpen(true);
  };

  const handleActiveDateChange = ({ activeStartDate }) => {
    setSelectedMonth(activeStartDate.getMonth());
    setSelectedYear(activeStartDate.getFullYear());
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500">
      <motion.div
        className="relative bg-white p-6 rounded-lg shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Calendar
          onClickDay={handleDateClick}
          onActiveDateChange={handleActiveDateChange}
          tileClassName={({ date }) => getTileClassName(date)}
          tileContent={({ date }) => (
            <div
              className="relative"
              onMouseEnter={(e) => handleMouseEnter(e, date)}
              onMouseLeave={handleMouseLeave}
            >
              <span>{getCommentsForDate(date) ? '📝' : ''}</span>
            </div>
          )}
        />
        {hoverDetails && (
          <div
            className="absolute bg-white p-2 border shadow-lg rounded"
            style={{
              left: hoverDetails.position.left,
              top: hoverDetails.position.top,
              zIndex: 10,
            }}
          >
            <span>{hoverDetails.text}</span>
          </div>
        )}
      </motion.div>

      <motion.div
        className="absolute bottom-10 left-0 right-0 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-blue-500 text-white p-4 rounded shadow-md">
          Total Overtime for {selectedMonth + 1}/{selectedYear}: {calculateTotalOvertimeForMonth().toFixed(2)} hours
        </div>
      </motion.div>

      {popupOpen && (
        <motion.div
          className="fixed top-0 left-0 right-0 bottom-0 bg-gray-600 bg-opacity-50 flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white p-6 rounded shadow-lg w-96 relative">
            <button
              onClick={() => setPopupOpen(false)}
              className="absolute top-2 right-2 text-gray-500 text-xl"
            >
              ✖
            </button>

            <h2 className="text-lg font-semibold mb-4">Add Punch-in / Punch-out for {date.toLocaleDateString()}</h2>

            <div className="flex gap-4 mb-4">
              <input
                type="time"
                value={punchInTime}
                onChange={(e) => setPunchInTime(e.target.value)}
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="time"
                value={punchOutTime}
                onChange={(e) => setPunchOutTime(e.target.value)}
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <textarea
              placeholder="Add comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />

            <div className="flex justify-between">
              <button
                onClick={handleSaveEntry}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Save Entry
              </button>
              <button
                onClick={() => setPopupOpen(false)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default App;
