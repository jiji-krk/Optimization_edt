from ortools.linear_solver import pywraplp
from ortools.linear_solver import pywraplp

def determine_course_type(subjects):

    course_type = {}
    for subject in subjects:
        if "CM" in subject:
            course_type[subject] = "CM"
        elif "TD" in subject:
            course_type[subject] = "TD"
        else:
            raise ValueError(f"Type de cours inconnu pour '{subject}'. Assurez-vous que le nom contient 'CM' ou 'TD'.")
    return course_type

def university_scheduling(group_names,   
                          rooms,         
                          subjects, 
                          teachers,
                          teacher_specialties,
                          periods_per_day=4, 
                          days_per_week=5):
    """
    Planification de CM (en ligne) et TD (en présentiel)
    pour des groupes (group_names) et des salles (rooms).
    Affichage final : on liste, pour chaque groupe, chaque créneau occupé.
    """
    
    # Générer automatiquement le course_type
    course_type = determine_course_type(subjects)

    # --- 1) Définition des ensembles ---
    # C: ensemble des cours
    C = range(len(subjects))
    # P: ensemble des périodes (5 jours × 4 créneaux = 20, par défaut)
    P = range(days_per_week * periods_per_day)
    # R: ensemble des salles
    R = range(len(rooms))
    # E: ensemble des enseignants
    E = range(len(teachers))
    # G: ensemble des groupes
    G = range(len(group_names))
    M = ['présentiel', 'enligne']

    # --- 2) Paramètres de base ---
    d_c = [2] * len(subjects)   # Durée (nombre de créneaux) de chaque cours
    n_g = [30] * len(group_names)  # 30 étudiants par groupe
    q_r = [60] * len(rooms)        # capacité de chaque salle

    solver = pywraplp.Solver.CreateSolver('CBC')
    if not solver:
        print("Erreur : le solveur n'a pas pu être initialisé.")
        return None

    # --- 3) Variables de décision ---
    # x[c, p, r, e] = 1 si le cours c est planifié
    #                 à la période p, salle r, enseignant e
    x = {}
    for c in C:
        for p in P:
            for r in R:
                for e in E:
                    x[c, p, r, e] = solver.IntVar(0, 1, f'x[{c},{p},{r},{e}]')

    # y[g, c, m] = 1 si le groupe g suit le cours c avec la modalité m
    # (Ici, on force TD=>présentiel, CM=>en ligne, via des contraintes)
    y = {}
    for g in G:
        for c in C:
            for m in M:
                y[g, c, m] = solver.IntVar(0, 1, f'y[{g},{c},{m}]')

    # --- 4) Contraintes ---

    # (A) Forcer la modalité (CM => en ligne, TD => présentiel)
    for c in C:
        subj = subjects[c]
        if course_type[subj] == "CM":
            for g in G:
                solver.Add(y[g, c, 'enligne'] == 1)
                solver.Add(y[g, c, 'présentiel'] == 0)
        elif course_type[subj] == "TD":
            for g in G:
                solver.Add(y[g, c, 'présentiel'] == 1)
                solver.Add(y[g, c, 'enligne'] == 0)

    # (B) Un enseignant ne peut enseigner que ses spécialités
    for c in C:
        for e in E:
            if subjects[c] not in teacher_specialties.get(teachers[e], []):
                for p in P:
                    for r in R:
                        solver.Add(x[c, p, r, e] == 0)

    # (C) Pas de conflit enseignant : un enseignant e ne peut donner deux cours en même temps
    for p in P:
        for e in E:
            solver.Add(
                sum(x[c, p, r, e] for c in C for r in R) <= 1
            )

    # (D) Capacité des salles : si un cours c est présentiel, 
    #     la somme n_g[g] ne doit pas dépasser q_r[r].
    for c in C:
        for r in R:
            for p in P:
                solver.Add(
                    sum(n_g[g] * y[g, c, 'présentiel'] for g in G) <= q_r[r]
                )

    # (E) Occupation salle : dans un créneau p et une salle r, max 1 cours
    for p in P:
        for r in R:
            solver.Add(
                sum(x[c, p, r, e] for c in C for e in E) <= 1
            )

    # (F) Durée des cours : chaque cours c occupe d_c[c] créneaux (au total)
    for c in C:
        solver.Add(
            sum(x[c, p, r, e] for p in P for r in R for e in E) == d_c[c]
        )

    # --- 5) Objectif ---
    # Minimiser la somme de x
    solver.Minimize(
        sum(x[c, p, r, e] for c in C for p in P for r in R for e in E)
    )

    # --- 6) Résolution ---
    status = solver.Solve()

    # --- 7) Lecture du résultat ---
    if status == pywraplp.Solver.OPTIMAL:
        print("Solution optimale trouvée :\n")

        # Préparons une structure de sortie
        full_schedule = []

        for c in C:
            subj = subjects[c]
            is_cm = (course_type[subj] == "CM")

            assigned_slots = []
            for p in P:
                for r in R:
                    for e in E:
                        if x[c, p, r, e].solution_value() > 0:
                            assigned_slots.append((p, r, e))

            for g in G:
                for (p, r, e) in assigned_slots:
                    salle_label = "Aucune salle (en ligne)" if is_cm else rooms[r]
                    full_schedule.append({
                        "group": group_names[g],
                        "subject": subj,
                        "teacher": teachers[e],
                        "period": f"Période {p + 1}",
                        "room": salle_label,
                        "modality": "enligne" if is_cm else "présentiel"
                    })

        full_schedule.sort(key=lambda item: (item["group"], item["period"]))
        return full_schedule
    else:
        print(f"Pas de solution optimale trouvée (status = {status})")
        return None



# curl.exe -X POST http://127.0.0.1:5000/schedule -H "Content-Type: application/json" --data-binary "@back-end/data.json"