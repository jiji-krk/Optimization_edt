## **Project: University Timetable Optimization**

### **Introduction**
This project solves a university scheduling problem using Google's OR-Tools library. The solution integrates:
- **React Native** for the mobile interface,
- **Flask (Python)** for backend API communication, and
- **OR-Tools** for optimization modeling.

The objective is to efficiently create a timetable that:
- Assigns **online lectures (CM)** and **in-person tutorials (TD)**, and
- Respects all constraints such as teacher availability, room capacities, and durations.


### **Problem Description**
#### **Sets and Parameters**
The scheduling problem is modeled using the following sets and parameters:
- **Groups**: Student groups (e.g., DIA1, DIA2).
- **Teachers**: Specialized teachers for specific subjects.
- **Rooms**: Physical rooms with specific capacities.
- **Courses**: Each course is either CM or TD.
- **Time slots**: Divided into days and periods.
- **Modalities**: Online or in-person.
- **Course duration**: Each course occupies a fixed number of time slots.

#### **Objective**
Minimize the total number of time slots used while ensuring a compact and feasible timetable.

---

### **Constraints**
1. **Course Modality**: CM must be online, and TD must be in-person.
2. **Teacher Specialization**: A teacher can only teach subjects in their specialization.
3. **Teacher Availability**: A teacher cannot teach two courses at the same time.
4. **Room Capacity**: Rooms must accommodate all assigned students.
5. **Room Occupancy**: A room cannot host multiple courses simultaneously.
6. **Course Duration**: Each course must occupy its predefined duration in time slots.


### **Application Structure**
#### **Frontend (React Native)**
The mobile application allows dynamic input of:
- Group names,
- Available rooms and their capacities,
- Subjects (with CM or TD),
- Teachers and their specialties.

The app sends this data to the Flask API and displays the resulting schedule as an interactive calendar.

#### **Backend (Flask API)**
The API provides:
- A `/schedule` endpoint that:
  - Processes the input data,
  - Calls OR-Tools to compute the optimized timetable,
  - Returns the schedule or an error message in case of infeasibility.

### **Results and Features**
1. **Results**:
   The timetable includes:
   - Group, subject, teacher, time slot, room, and modality (online or in-person).
   - A reduced number of time slots while respecting constraints.

2. **Visualization**:
   The frontend displays:
   - Weekly schedules with distinct colors for online and in-person classes.

3. **Future Extensions**:
   - Improved teacher availability management,
   - Variable number of days or periods,
   - Advanced constraints (e.g., course continuity),
   - Export to `.ics` calendar format.

### **Conclusion**
This modular system provides a robust solution for university timetable optimization. The integration of React Native, Flask, and OR-Tools makes it adaptable to various scheduling scenarios. The model can also be extended for more complex use cases.


![Uploading BOYER Hugo, KRIKA Camila, KRIKA Jinane (2).png…]()


