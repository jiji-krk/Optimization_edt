import React, { useState } from 'react';



export default function Schedule() {
  const [groupNames, setGroupNames] = useState(['DIA1', 'DIA2']);
  const [rooms, setRooms] = useState(['A', 'B', 'C', 'D']);
  const [subjects, setSubjects] = useState(['Maths CM', 'Maths TD', 'Physique CM', 'Physique TD']);
  const [teachers, setTeachers] = useState(['Mme Camila', 'Mr Boyer', 'Mme Krika']);
  const [teacherSpecialties, setTeacherSpecialties] = useState({});
  const [planning, setPlanning] = useState(null);
  const [error, setError] = useState('');

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
      [teacher]: prev[teacher] ? [...new Set([...prev[teacher], subject])] : [subject], // Assurer unicité
    }));
  };

  const handleRemoveSpecialty = (teacher, subject) => {
    setTeacherSpecialties((prev) => ({
      ...prev,
      [teacher]: prev[teacher]?.filter((item) => item !== subject) || [],
    }));
  };

  const handleSubmit = async () => {
    try {
      setError('');

      // Calculer dynamiquement les types de cours
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

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Créer un Planning</h1>

      <DynamicField items={groupNames} setItems={setGroupNames} placeholder="Nom du groupe" />
      <DynamicField items={rooms} setItems={setRooms} placeholder="Nom de la salle" />
      <DynamicField items={subjects} setItems={setSubjects} placeholder="Nom de la matière" />
      <DynamicField
        items={teachers}
        setItems={handleTeacherChange}
        placeholder="Nom de l'enseignant"
      />

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

      {planning && (
        <div style={{ marginTop: '20px' }}>
          <h2>Planning généré :</h2>
          {Array.isArray(planning) ? (
            planning.map((item, index) => (
              <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
                {item.error ? (
                  <p style={{ color: 'red' }}>{item.error}</p>
                ) : (
                  <>
                    <p>Groupe : {item.group}</p>
                    <p>Cours : {item.subject}</p>
                    <p>Enseignant : {item.teacher}</p>
                    <p>Salle : {item.room}</p>
                    <p>Période : {item.period}</p>
                    <p>Modalité : {item.modality}</p>
                  </>
                )}
              </div>
            ))
          ) : (
            <p>Aucun planning généré.</p>
          )}
        </div>
      )}
    </div>
  );
}

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
