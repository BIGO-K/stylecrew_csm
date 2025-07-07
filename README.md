# 스타일크루 CSM
_2020.02 ~ 2020.07_
+ 엠몬스타 전체 일정
+ 기획 구글드라이브 경로
+ 디자인 구글드라이브 경로
+ 퍼블리싱 작업 리스트
<br><br>

## 작업환경
+ vscode에서 작업할 경우 **SFTP** 를 이용하면 FTP에 바로 업로드됩니다.
	- SFTP의 **sftp.json** 파일설정
		```
		"name": "ftp",
		"host": "",
		"protocol": "sftp",
		"port": 8023,
		"username": "",
		"password": "비밀번호",
		"remotePath": "",
		"uploadOnSave": true,
		...
		"watcher": {
			"files": "**",
			"autoUpload": false,
			"autoDelete": false
		},
		"ignore": [".vscode", ".git", ".DS_Store"]
		...
		```
	- css, fonts, html, js, scss, image 등 모든 폴더에 watch가 걸려있어 변화가 생기면 자동으로 업로드됩니다.
	- images 폴더는 포토샵에서 save for web을 할 때 파일이 생성되는 시점이 달라 오류 발생할 수 있습니다. (이슈 발생 시 ignore에 추가 테스트 필요)
	- 동기화가 되어 따로 파일을 삭제하지 않아도 됩니다.

- - -
## 작업관련 문서 확인 경로
+ HTML https://github.com/m-monstar/__ui__stylecrew__csm/wiki/HTML
+ CSS/SCSS https://github.com/m-monstar/__ui__stylecrew__csm/wiki/CSS-SCSS
+ JAVASCRIPT https://github.com/m-monstar/__ui__stylecrew__csm/wiki/JAVASCRIPT
+ EMAIL TEMPLATE https://github.com/m-monstar/__ui__stylecrew__csm/wiki/Email-Template
