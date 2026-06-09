import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

const TimeStepper = ({ value, onChange, min = 0, max = 99, step = 1, label = '', unit = '' }) => {
  // State for edit mode (tap to type)
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // When entering edit mode, select all text
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  // Clamp value within bounds
  const clamp = useCallback((v) => Math.min(max, Math.max(min, v)), [min, max]);

  const increment = useCallback(() => {
    onChange(clamp(value + step));
  }, [value, step, clamp, onChange]);

  const decrement = useCallback(() => {
    onChange(clamp(value - step));
  }, [value, step, clamp, onChange]);

  // Press and hold for continuous increment/decrement
  const startHold = useCallback((action) => {
    if (timeoutRef.current) return;
    action(); // fire once immediately
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(action, 100);
    }, 400); // start repeating after 400ms hold
  }, []);

  const stopHold = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  // Handle direct keyboard input
  const handleEditSubmit = useCallback(() => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      onChange(clamp(Math.round(parsed / step) * step));
    }
    setIsEditing(false);
  }, [editValue, clamp, step, onChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(String(value));
    }
  }, [handleEditSubmit, value]);

  return (
    <div className="time-stepper">
      {label && <span className="time-stepper__label">{label}</span>}
      <div className="time-stepper__controls">
        <motion.button
          className="time-stepper__btn"
          whileTap={{ scale: 0.9 }}
          onMouseDown={() => startHold(decrement)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold(decrement)}
          onTouchEnd={stopHold}
          disabled={value <= min}
          type="button"
          aria-label="Decrease"
        >
          <Minus size={18} />
        </motion.button>

        {isEditing ? (
          <input
            ref={inputRef}
            className="time-stepper__input time-stepper__input--editing"
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            step={step}
            autoFocus
          />
        ) : (
          <motion.button
            className="time-stepper__value"
            onClick={() => {
              setEditValue(String(value));
              setIsEditing(true);
            }}
            whileTap={{ scale: 0.95 }}
            type="button"
            aria-label="Tap to edit value"
          >
            {value}
          </motion.button>
        )}

        <motion.button
          className="time-stepper__btn"
          whileTap={{ scale: 0.9 }}
          onMouseDown={() => startHold(increment)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold(increment)}
          onTouchEnd={stopHold}
          disabled={value >= max}
          type="button"
          aria-label="Increase"
        >
          <Plus size={18} />
        </motion.button>
      </div>
      {unit && <span className="time-stepper__unit">{unit}</span>}
    </div>
  );
};

export default TimeStepper;
