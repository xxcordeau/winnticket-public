pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'  // Jenkins > Global Tool Configuration에서 설정한 NodeJS 이름
    }

    environment {
        DEPLOY_SERVER = credentials('winnticket-deploy-server')  // Jenkins Credentials에 등록
        DEPLOY_USER   = credentials('winnticket-deploy-user')    // Jenkins Credentials에 등록
        DEPLOY_PATH   = '/var/www/winnticket'
        SSH_CREDENTIALS_ID = 'winnticket-ssh-key'  // Jenkins에 등록한 SSH 자격 증명 ID
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 소스코드 체크아웃...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 npm install...'
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci'
            }
        }

        stage('Type Check') {
            steps {
                echo '🔍 TypeScript 타입 체크...'
                sh 'npm run typecheck || true'
            }
        }

        stage('Build') {
            steps {
                echo '🔨 프로덕션 빌드...'
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                echo '🚀 개발서버에 배포...'
                sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                    // 1. 배포 디렉토리 생성 (없으면)
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} '
                            sudo mkdir -p ${DEPLOY_PATH}
                            sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${DEPLOY_PATH}
                        '
                    """

                    // 2. 기존 파일 백업 & 삭제
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} '
                            if [ -d ${DEPLOY_PATH}/current ]; then
                                sudo rm -rf ${DEPLOY_PATH}/backup
                                sudo mv ${DEPLOY_PATH}/current ${DEPLOY_PATH}/backup
                            fi
                            mkdir -p ${DEPLOY_PATH}/current
                        '
                    """

                    // 3. 빌드 결과물 전송
                    sh """
                        scp -o StrictHostKeyChecking=no -r build/* ${DEPLOY_USER}@${DEPLOY_SERVER}:${DEPLOY_PATH}/current/
                    """

                    // 4. nginx 리로드
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} '
                            sudo nginx -t && sudo nginx -s reload
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ 프론트엔드 배포 성공!'
        }
        failure {
            echo '❌ 프론트엔드 배포 실패!'
            // 롤백: 백업이 있으면 복원
            sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} '
                        if [ -d ${DEPLOY_PATH}/backup ]; then
                            sudo rm -rf ${DEPLOY_PATH}/current
                            sudo mv ${DEPLOY_PATH}/backup ${DEPLOY_PATH}/current
                            sudo nginx -t && sudo nginx -s reload
                            echo "🔄 롤백 완료"
                        fi
                    ' || true
                """
            }
        }
    }
}
