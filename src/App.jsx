import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

function App() {
  const [date, setDate] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [punchInTime, setPunchInTime] = useState('');
  const [punchOutTime, setPunchOutTime] = useState('');
  const [comment, setComment] = useState('');
  const [dailyData, setDailyData] = useState([]);
  const [hoverDetails, setHoverDetails] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // Track the selected month
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Track the selected year

  // Define work hours (10:00 AM - 7:00 PM)
  const workStartTime = "10:00"; // 10:00 AM
  const workEndTime = "19:00"; // 7:00 PM

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('timesheetData')) || [];
    setDailyData(savedData);
  }, []);

  // Save data to localStorage
  const saveData = (newData) => {
    setDailyData(newData);
    localStorage.setItem('timesheetData', JSON.stringify(newData));
  };

  // Handle adding a new punch-in, punch-out entry
  const handleSaveEntry = () => {
    if (punchInTime && punchOutTime && comment.trim()) {
      const entryDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      const newEntry = { entryDate, punchInTime, punchOutTime, comment };

      const updatedData = [...dailyData, newEntry];
      saveData(updatedData);
      setPunchInTime('');
      setPunchOutTime('');
      setComment('');
      setPopupOpen(false); // Close the popup
    }
  };

  // Function to check if punch-in and punch-out are within work hours
  const isWithinWorkHours = (punchInTime, punchOutTime) => {
    const punchIn = new Date(`1970-01-01T${punchInTime}:00`);
    const punchOut = new Date(`1970-01-01T${punchOutTime}:00`);
    const startWork = new Date(`1970-01-01T${workStartTime}:00`);
    const endWork = new Date(`1970-01-01T${workEndTime}:00`);

    return punchIn >= startWork && punchOut <= endWork;
  };

  // Function to calculate overtime for a single entry
  const calculateOvertime = (punchInTime, punchOutTime) => {
    const punchIn = new Date(`1970-01-01T${punchInTime}:00`);
    const punchOut = new Date(`1970-01-01T${punchOutTime}:00`);

    // Regular work hours (10:00 AM to 7:00 PM) => 9 hours
    const regularWorkHours = 9 * 60 * 60 * 1000; // 9 hours in milliseconds

    const workedHours = punchOut - punchIn;

    // Overtime is the difference if worked hours exceed regular hours
    if (workedHours > regularWorkHours) {
      const overtime = workedHours - regularWorkHours;
      return overtime / (1000 * 60 * 60); // Convert milliseconds to hours
    }
    return 0; // No overtime
  };

  // Function to calculate total overtime for the selected month and year
  const calculateTotalOvertimeForMonth = () => {
    const selectedMonthData = dailyData.filter(entry => {
      const entryDate = new Date(entry.entryDate);
      return entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
    });

    return selectedMonthData.reduce((totalOvertime, entry) => {
      return totalOvertime + calculateOvertime(entry.punchInTime, entry.punchOutTime);
    }, 0);
  };

  // Get all comments for the selected date
  const getCommentsForDate = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    return dailyData.filter(entry => entry.entryDate === formattedDate)
      .map(entry => `${entry.punchInTime} - ${entry.punchOutTime}: ${entry.comment}`).join(", ");
  };

  // Get background color based on time validation
  const getTileClassName = (date) => {
    const entry = dailyData.find((entry) => entry.entryDate === date.toISOString().split('T')[0]);

    if (entry) {
      const { punchInTime, punchOutTime } = entry;
      return isWithinWorkHours(punchInTime, punchOutTime) ? 'bg-green-300' : 'bg-red-300';
    }

    return ''; // Default case, no entry for this date
  };

  // Handle Mouse Enter and Leave for Hover Details
  const handleMouseEnter = (e, date) => {
    const comments = getCommentsForDate(date);
    if (comments) {
      const rect = e.target.getBoundingClientRect(); // Get position of the date cell
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
    setPopupOpen(true); // Open the popup
  };

  // Handle month change (when user navigates to a new month)
  const handleActiveDateChange = ({ activeStartDate }) => {
    setSelectedMonth(activeStartDate.getMonth());
    setSelectedYear(activeStartDate.getFullYear());
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
      <div className="relative">
        <Calendar
          onClickDay={handleDateClick}
          onActiveDateChange={handleActiveDateChange} // This triggers when the month changes
          tileClassName={({ date }) => getTileClassName(date)} // Apply color based on time check
          tileContent={({ date }) => (
            <div
              className="relative"
              onMouseEnter={(e) => handleMouseEnter(e, date)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Add a marker for dates with comments */}
              <span>{getCommentsForDate(date) ? '📝' : ''}</span>
            </div>
          )}
        />

        {/* Hovering details */}
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
      </div>

      {/* Total Overtime for the Selected Month */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <div className="bg-blue-500 text-white p-4 rounded shadow-md">
          Total Overtime for {selectedMonth + 1}/{selectedYear}: {calculateTotalOvertimeForMonth().toFixed(2)} hours
        </div>
      </div>

      {/* Popup Form (Appears on Date Click) */}
      {popupOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96 relative">
            <h2 className="text-lg font-semibold mb-4">Add Punch-in / Punch-out for {date.toLocaleDateString()}</h2>

            <button
              onClick={() => setPopupOpen(false)} // Close the popup
              className="absolute top-2 right-2 text-gray-500 text-xl"
            >
              ✖
            </button>

            <div className="flex gap-4 mb-4">
              <input
                type="time"
                value={punchInTime}
                onChange={(e) => setPunchInTime(e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="time"
                value={punchOutTime}
                onChange={(e) => setPunchOutTime(e.target.value)}
                className="p-2 border rounded"
              />
            </div>

            <textarea
              placeholder="Add comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />

            <div className="flex justify-between">
              <button
                onClick={handleSaveEntry}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Save Entry
              </button>
              <button
                onClick={() => setPopupOpen(false)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
