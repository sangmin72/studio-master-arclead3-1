// Real-time date and time display
(function() {
    'use strict';

    function updateDateTime() {
        const now = new Date();
        
        // 한국 시간으로 설정
        const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
        
        const year = koreaTime.getFullYear();
        const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
        const day = String(koreaTime.getDate()).padStart(2, '0');
        const hours = String(koreaTime.getHours()).padStart(2, '0');
        const minutes = String(koreaTime.getMinutes()).padStart(2, '0');
        const seconds = String(koreaTime.getSeconds()).padStart(2, '0');
        
        const formattedDateTime = `${year}년 ${month}월 ${day}일 ${hours}:${minutes}:${seconds}`;
        
        const datetimeElement = document.getElementById('current-datetime');
        if (datetimeElement) {
            datetimeElement.textContent = formattedDateTime;
        }
    }

    // 페이지 로드 시 즉시 실행
    document.addEventListener('DOMContentLoaded', function() {
        updateDateTime();
        // 매 초마다 업데이트
        setInterval(updateDateTime, 1000);
    });

    // 페이지가 이미 로드된 경우를 위한 처리
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            updateDateTime();
            setInterval(updateDateTime, 1000);
        });
    } else {
        updateDateTime();
        setInterval(updateDateTime, 1000);
    }
})(); 