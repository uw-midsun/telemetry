package rest

import (
	"crypto/sha256"
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	log "github.com/golang/glog"
	_ "github.com/mattn/go-sqlite3" // DB impl
)

// InitAuthDb Creates authentication DB table
func InitAuthDb(db *sql.DB) {
	createOAuthTbl := `
			CREATE TABLE IF NOT EXISTS
				auth (token TEXT, CONSTRAINT unique_tokens UNIQUE(token));`

	_, err := db.Exec(createOAuthTbl)
	if err != nil {
		log.Errorf("Failed to create OAuth table " + err.Error())
	}
}

// AddTokenToDb Adds a token to the authentication DB table
func AddTokenToDb(token string, db *sql.DB) {
	if token != "" {
		hashed := sha256.Sum256([]byte(token))
		hashedHex := fmt.Sprintf("%x", hashed)
		insertQuery := "INSERT INTO auth(token) VALUES (?)"
		_, err := db.Exec(insertQuery, hashedHex)
		if err != nil {
			log.Errorf("Could add token to db: " + err.Error())
		}
	}
}

// ValidateAuthHeader Validates that a header is a valid auth header
func ValidateAuthHeader(header http.Header, db *sql.DB) bool {
	authTokenSlice := strings.Split(header.Get("Authorization"), "Bearer ")
	if len(authTokenSlice) != 2 {
		return false
	}
	authToken := authTokenSlice[1]
	hashedToken := sha256.Sum256([]byte(authToken))
	hashedTokenHex := fmt.Sprintf("%x", hashedToken)

	authQuery := `SELECT * FROM auth WHERE token = ? LIMIT 1;`
	rows, err := db.Query(authQuery, hashedTokenHex)
	defer rows.Close()

	if err != nil {
		return false
	}

	if rows.Next() {
		return true
	}

	return false
}
