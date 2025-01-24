import React, { useState } from 'react';

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

// 4 créneaux (chacun 1h30, par exemple)
const SLOTS = [
  { label: "Période 1 (8h–9h30)", time: "8h–9h30" },
  { label: "Période 2 (9h30–11h)", time: "9h30–11h" },
  { label: "Période 3 (11h–12h30)", time: "11h–12h30" },
  { label: "Période 4 (13h30–15h)", time: "13h30–15h" },
];

// Fonction utilitaire : extraire l'entier X de "Période X"
function getPeriodNumber(periodString) {

  const parts = periodString.split(" ");
  if (parts.length >= 2) {
    return parseInt(parts[1], 10);
  }
  return 0;
}

// Construit la structure calendrier : daySlotData[day][slot] = []
// en filtrant uniquement pour la classe (DIA X) sélectionnée
function buildCalendarData(planning, selectedGroup) {

  const daySlotData = Array.from({ length: 5 }, () =>
    Array.from({ length: 4 }, () => [])
  );

  // Parcourir tous les items du planning
  planning.forEach((item) => {
    // Filtrer par groupe
    if (item.group !== selectedGroup) {
      return;
    }
    // item.period = "Période X"
    const periodNum = getPeriodNumber(item.period);
    if (periodNum < 1 || periodNum > 20) return; // Lundi à Vendredi, 4 créneaux par jour donc 4*5(jours) ie semaine = 20

    const dayIndex = Math.floor((periodNum - 1) / 4); 
    const slotIndex = (periodNum - 1) % 4;           

    daySlotData[dayIndex][slotIndex].push(item);
  });

  return daySlotData;
}

/* ---------------------------------------------------
   Composant principal : Schedule
   --------------------------------------------------- */
export default function Schedule() {
  const [groupNames, setGroupNames] = useState(['DIA1', 'DIA2']);
  const [rooms, setRooms] = useState(['A', 'B', 'C', 'D']);
  const [subjects, setSubjects] = useState(['Maths CM', 'Maths TD', 'Physique CM', 'Physique TD']);
  const [teachers, setTeachers] = useState(['Mme Camila', 'Mr Boyer', 'Mme Krika']);
  const [teacherSpecialties, setTeacherSpecialties] = useState({});

  // Planning renvoyé par le back-end
  const [planning, setPlanning] = useState(null);
  const [error, setError] = useState('');

  // Groupe sélectionné (pour l'affichage calendrier)
  const [selectedGroup, setSelectedGroup] = useState('DIA1');

  // Fonction appelée lorsque les enseignants changent
  const handleTeacherChange = (newTeachers) => {
    const updatedSpecialties = { ...teacherSpecialties };

    // Ajouter les nouveaux enseignants avec des spécialités vides
    newTeachers.forEach((teacher) => {
      if (!updatedSpecialties[teacher]) {
        updatedSpecialties[teacher] = [];
      }
    });

    // Retirer les enseignants supprimés
    Object.keys(updatedSpecialties).forEach((teacher) => {
      if (!newTeachers.includes(teacher)) {
        delete updatedSpecialties[teacher];
      }
    });

    setTeachers(newTeachers);
    setTeacherSpecialties(updatedSpecialties);
  };

  // Gestion dynamique des spécialités
  const handleAddSpecialty = (teacher, subject) => {
    setTeacherSpecialties((prev) => ({
      ...prev,
      [teacher]: prev[teacher] ? [...new Set([...prev[teacher], subject])] : [subject],
    }));
  };

  const handleRemoveSpecialty = (teacher, subject) => {
    setTeacherSpecialties((prev) => ({
      ...prev,
      [teacher]: prev[teacher]?.filter((item) => item !== subject) || [],
    }));
  };

  // Appel du back-end pour générer le planning
  const handleSubmit = async () => {
    try {
      setError('');

      // Déterminer si un cours est CM ou TD (selon son nom)
      const courseType = subjects.reduce((acc, subject) => {
        acc[subject] = subject.includes('CM') ? 'CM' : 'TD';
        return acc;
      }, {});

      const data = {
        group_names: groupNames,
        rooms,
        subjects,
        teachers,
        teacher_specialties: teacherSpecialties,
        course_type: courseType, // Passé dynamiquement
      };

      const response = await fetch('http://127.0.0.1:5000/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setPlanning(result);
    } catch (err) {
      console.error('Erreur lors de la requête :', err);
      setError('Impossible de générer le planning. Vérifiez les données et réessayez.');
    }
  };

  // Construction du calendrier pour le groupe sélectionné
  let calendarData = null;
  if (Array.isArray(planning)) {
    calendarData = buildCalendarData(planning, selectedGroup);
  }

  // Rendu final
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Créer un Planning 📅</h1>

      {/* Champs dynamiques pour Groups, Rooms, Subjects, Teachers */}
      <DynamicField items={groupNames} setItems={setGroupNames} placeholder="Nom du groupe" />
      <DynamicField items={rooms} setItems={setRooms} placeholder="Nom de la salle" />
      <DynamicField items={subjects} setItems={setSubjects} placeholder="Nom de la matière" />
      <DynamicField items={teachers} setItems={handleTeacherChange} placeholder="Nom de l'enseignant" />

      <div style={{ marginTop: '20px' }}>
        <h2>Spécialités des enseignants</h2>
        {teachers.map((teacher) => (
          <div key={teacher} style={{ marginBottom: '15px' }}>
            <h3>{teacher}</h3>
            <div>
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() =>
                    teacherSpecialties[teacher]?.includes(subject)
                      ? handleRemoveSpecialty(teacher, subject)
                      : handleAddSpecialty(teacher, subject)
                  }
                  style={{
                    margin: '5px',
                    padding: '8px',
                    border: '1px solid',
                    backgroundColor: teacherSpecialties[teacher]?.includes(subject)
                      ? '#28a745'
                      : '#fff',
                    color: teacherSpecialties[teacher]?.includes(subject) ? '#fff' : '#000',
                    cursor: 'pointer',
                  }}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button
        style={{
          backgroundColor: '#007BFF',
          color: '#fff',
          border: 'none',
          padding: '10px 15px',
          cursor: 'pointer',
          marginTop: '20px',
        }}
        onClick={handleSubmit}
      >
        Générer le Planning
      </button>

      {/* Choix du groupe à afficher dans le calendrier */}
      <div style={{ marginTop: '20px' }}>
        <label>
          <strong>Voir le calendrier pour la classe : </strong>
        </label>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          style={{ marginLeft: '10px', padding: '5px' }}
        >
          {groupNames.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Affichage du calendrier pour la classe sélectionnée */}
      {Array.isArray(planning) && (
        <CalendarView
          calendarData={calendarData}
          selectedGroup={selectedGroup}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------
   Composant pour afficher le calendrier
   --------------------------------------------------- */
function CalendarView({ calendarData, selectedGroup }) {
  if (!calendarData) {
    return <p>Aucun planning généré.</p>;
  }

  const tableStyle = {
    borderCollapse: 'collapse',
    width: '100%',
    marginTop: '20px',
  };

  const thStyle = {
    border: '1px solid #ccc',
    padding: '10px',
    backgroundColor: '#f0f0f0',
    textAlign: 'center',
  };

  const tdStyle = {
    border: '1px solid #ccc',
    padding: '10px',
    verticalAlign: 'top',
    height: '100px',
    minWidth: '120px',
  };

  // Affiche la liste des cours d'un slot
  const renderSlotCourses = (slotCourses) => {
    if (slotCourses.length === 0) {
      return <span style={{ color: '#aaa' }}>Aucun cours</span>;
    }
    return slotCourses.map((item, idx) => {
      const bgColor = item.modality === 'présentiel' ? '#4da6ff' : '#ffa64d'; // bleu ou orange
      return (
        <div
          key={idx}
          style={{
            backgroundColor: bgColor,
            marginBottom: '8px',
            padding: '6px',
            borderRadius: '4px',
            color: '#fff',
          }}
        >
          <strong>{item.subject}</strong> <br />
          Prof : {item.teacher} <br />
          Salle : {item.room}
        </div>
      );
    });
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h2>Calendrier de {selectedGroup}</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Créneau</th>
            {DAYS.map((dayName, dayIndex) => (
              <th key={dayIndex} style={thStyle}>
                {dayName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map((slot, slotIndex) => (
            <tr key={slotIndex}>
              {/* Colonne horaire */}
              <td style={tdStyle}>
                <strong>{slot.label}</strong>
                <br />
                {slot.time}
              </td>
              {/* 5 jours */}
              {DAYS.map((_, dayIndex) => {
                const slotCourses = calendarData[dayIndex][slotIndex];
                return (
                  <td key={dayIndex} style={tdStyle}>
                    {renderSlotCourses(slotCourses)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------
   Champ dynamique réutilisable
   --------------------------------------------------- */
function DynamicField({ items, setItems, placeholder }) {
  return (
    <div style={{ marginBottom: '15px' }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <input
            type="text"
            value={item}
            onChange={(e) =>
              setItems(items.map((current, i) => (i === index ? e.target.value : current)))
            }
            placeholder={placeholder}
            style={{ padding: '8px', flex: 1, marginRight: '10px' }}
          />
          <button
            onClick={() => setItems(items.filter((_, i) => i !== index))}
            style={{
              backgroundColor: '#FF4D4F',
              color: '#fff',
              border: 'none',
              padding: '5px 10px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => setItems([...items, ''])}
        style={{
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          padding: '5px 10px',
          cursor: 'pointer',
        }}
      >
        + Ajouter
      </button>
    </div>
  );
}
