import requests
import json

API_BASE_URL = "http://localhost:8000" # 혹은 172.30.1.84 확인 필요

def test_update_schedule():
    # 1. 기존 일정 조회하여 ID 하나 가져오기
    try:
        response = requests.get(f"{API_BASE_URL}/api/schedule")
        schedules = response.json()
        if not schedules:
            print("테스트할 일정이 없습니다.")
            return
        
        target = schedules[0]
        schedule_id = target['id']
        print(f"테스트 대상 ID: {schedule_id}, 기존 날짜: {target['date']}")

        # 2. 수정 시도
        payload = {
            "date": "20260999", # 임시 테스트 날짜
            "home": 1,
            "away": 2
        }
        
        update_response = requests.put(f"{API_BASE_URL}/api/schedule/{schedule_id}", json=payload)
        print("수정 응답:", update_response.json())

        if update_response.status_code == 200:
            print("API 수정 테스트 성공!")
        else:
            print(f"API 수정 테스트 실패: {update_response.status_code}")

    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    # 백엔드가 실행 중인지 확인 필요
    test_update_schedule()
