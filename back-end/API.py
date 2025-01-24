from flask import Flask, request, jsonify
from app import university_scheduling, determine_course_type  # Assurez-vous que determine_course_type est importé
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route('/schedule', methods=['POST'])
def schedule():
    try:
        # Récupérer les données JSON envoyées par le frontend
        data = request.get_json()

        # Extraire les paramètres nécessaires depuis les données reçues
        group_names = data['group_names']
        rooms = data['rooms']
        subjects = data['subjects']
        teachers = data['teachers']
        teacher_specialties = data['teacher_specialties']
        periods_per_day = data.get('periods_per_day', 4)
        days_per_week = data.get('days_per_week', 5)

        # Si course_type n'est pas fourni, le déduire automatiquement
        course_type = data.get('course_type', determine_course_type(subjects))

        # Appeler la fonction de planification
        result = university_scheduling(
            group_names, rooms, subjects, teachers, teacher_specialties,
            periods_per_day, days_per_week
        )

        if result is None:
            return jsonify({"error": "No optimal solution found"}), 400

        return jsonify(result), 200

    except KeyError as e:
        # Gestion des champs manquants
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400

    except ValueError as e:
        # Gestion des erreurs liées aux types de cours ou aux données invalides
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        # Gestion des erreurs génériques
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)
