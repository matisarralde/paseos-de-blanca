
import { useState, useEffect } from 'react';
import { db } from './firebase/config'; // Make sure this path is correct
import { collection, onSnapshot, doc, updateDoc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { Header } from './components/Header';
import { ScheduleView } from './components/ScheduleView';
import { Leaderboard } from './components/Leaderboard';
import { Footer } from './components/Footer';
import { getWeekId, getScheduleForWeek, getCompletionPercentage } from './utils';
import { Person, Walk, View } from './types';

function App() {
  const [family, setFamily] = useState<Person[]>([]);
  const [schedule, setSchedule] = useState<Walk[]>([]);
  const [view, setView] = useState<View>('schedule');
  const [weekId, setWeekId] = useState(getWeekId(new Date()));
  const [isLoading, setIsLoading] = useState(true);

  // Listener for family data
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'family'), (snapshot) => {
      const familyData = snapshot.docs.map(doc => doc.data() as Person);
      setFamily(familyData);
    });
    return () => unsub();
  }, []);

  // Listener for schedule data for the current week
  useEffect(() => {
    setIsLoading(true);
    const scheduleDocRef = doc(db, 'schedules', weekId);

    const unsub = onSnapshot(scheduleDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const scheduleData = docSnap.data().walks as Walk[];
        // Firestore timestamps need to be converted to JS Dates
        const scheduleWithDates = scheduleData.map(walk => ({
          ...walk,
          date: (walk.date as any).toDate(), 
        }));
        setSchedule(scheduleWithDates);
      } else {
        // If schedule doesn't exist, create it for the current week
        console.log(`No schedule found for ${weekId}, creating one...`);
        const newSchedule = getScheduleForWeek(new Date());
        try {
          await setDoc(scheduleDocRef, { walks: newSchedule });
          // The listener will automatically pick up the new data, so no need to setSchedule here
        } catch (error) {
          console.error("Error creating new schedule:", error);
        }
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, [weekId]);

  const handleSwap = async (walkId1: string, walkId2: string) => {
    const walk1 = schedule.find(w => w.id === walkId1);
    const walk2 = schedule.find(w => w.id === walkId2);

    if (!walk1 || !walk2) return;

    // We only need to update the personId for each walk
    const scheduleDocRef = doc(db, 'schedules', weekId);
    
    // Create a new schedule array with the swapped walks
    const newSchedule = schedule.map(w => {
      if (w.id === walkId1) return { ...w, personId: walk2.personId };
      if (w.id === walkId2) return { ...w, personId: walk1.personId };
      return w;
    });

    try {
      await updateDoc(scheduleDocRef, { walks: newSchedule });
    } catch (error) {
      console.error("Error swapping walks:", error);
    }
  };

  const handleClaimWalk = async (walkId: string, personId: string) => {
    const scheduleDocRef = doc(db, 'schedules', weekId);
    
    const newSchedule = schedule.map(w => 
      w.id === walkId ? { ...w, personId } : w
    );

    try {
      await updateDoc(scheduleDocRef, { walks: newSchedule });
    } catch (error) {
      console.error("Error claiming walk:", error);
    }
  };
  
  const handleCompleteWalk = async (walkId: string, isCompleted: boolean) => {
    const scheduleDocRef = doc(db, 'schedules', weekId);

    const newSchedule = schedule.map(w => {
      if (w.id === walkId) {
        return { 
          ...w, 
          isCompleted,
          completionTime: isCompleted ? new Date().toISOString() : undefined
        };
      }
      return w;
    });
    
    try {
      await updateDoc(scheduleDocRef, { walks: newSchedule });
    } catch (error) {
      console.error("Error completing walk:", error);
    }
  };

  const goToPreviousWeek = () => {
    const currentWeekDate = schedule.length > 0 ? schedule[0].date : new Date();
    const previousWeekDate = new Date(currentWeekDate);
    previousWeekDate.setDate(currentWeekDate.getDate() - 7);
    setWeekId(getWeekId(previousWeekDate));
  };

  const goToNextWeek = () => {
    const currentWeekDate = schedule.length > 0 ? schedule[0].date : new Date();
    const nextWeekDate = new Date(currentWeekDate);
    nextWeekDate.setDate(currentWeekDate.getDate() + 7);
    setWeekId(getWeekId(nextWeekDate));
  };
  
  const goToCurrentWeek = () => {
    setWeekId(getWeekId(new Date()));
  };

  const completionPercentage = getCompletionPercentage(schedule);

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      <Header 
        view={view} 
        setView={setView} 
        percentage={completionPercentage}
        onPrevWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onCurrentWeek={goToCurrentWeek}
        currentWeekId={weekId}
      />
      <main className="px-4 py-8">
        {isLoading ? (
          <div className="text-center text-lg">Cargando datos...</div>
        ) : view === 'schedule' ? (
          <ScheduleView
            schedule={schedule}
            family={family}
            onSwap={handleSwap}
            onClaimWalk={handleClaimWalk}
            onCompleteWalk={handleCompleteWalk}
          />
        ) : (
          <Leaderboard schedule={schedule} family={family} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
