package email

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"os"
	"strings"
)

type Service interface {
	Send(to, subject, text string, html *string) error
}

type SMTPService struct {
	host     string
	port     string
	username string
	password string
	from     string
	fromName string
}

func New() *SMTPService {
	return &SMTPService{
		host:     os.Getenv("SMTP_HOST"),
		port:     os.Getenv("SMTP_PORT"),
		username: os.Getenv("MAILJET_API_KEY"),
		password: os.Getenv("MAILJET_SECRET_KEY"),
		from:     os.Getenv("MAIL_FROM_ADDRESS"),
		fromName: os.Getenv("MAIL_FROM_NAME"),
	}
}

func (s *SMTPService) Send(to, subject, text string, html *string) error {
	addr := net.JoinHostPort(s.host, s.port)

	var body string
	if html != nil && *html != "" {
		body = s.buildMultipart(to, subject, text, *html)
	} else {
		body = fmt.Sprintf(
			"From: %s <%s>\r\nTo: %s\r\nSubject: %s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
			s.fromName, s.from, to, subject, text,
		)
	}

	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return fmt.Errorf("smtp dial: %w", err)
	}

	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		return fmt.Errorf("smtp client: %w", err)
	}
	defer client.Quit()

	if err = client.StartTLS(&tls.Config{ServerName: s.host}); err != nil {
		return fmt.Errorf("smtp starttls: %w", err)
	}

	if err = client.Auth(smtp.PlainAuth("", s.username, s.password, s.host)); err != nil {
		return fmt.Errorf("smtp auth: %w", err)
	}

	if err = client.Mail(s.from); err != nil {
		return fmt.Errorf("smtp mail from: %w", err)
	}

	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("smtp rcpt: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}

	if _, err = w.Write([]byte(body)); err != nil {
		return fmt.Errorf("smtp write: %w", err)
	}

	return w.Close()
}

func (s *SMTPService) buildMultipart(to, subject, text, html string) string {
	boundary := "==WATCHTOWER_BOUNDARY=="
	var b strings.Builder

	fmt.Fprintf(&b, "From: %s <%s>\r\n", s.fromName, s.from)
	fmt.Fprintf(&b, "To: %s\r\n", to)
	fmt.Fprintf(&b, "Subject: %s\r\n", subject)
	b.WriteString("MIME-Version: 1.0\r\n")
	fmt.Fprintf(&b, "Content-Type: multipart/alternative; boundary=\"%s\"\r\n\r\n", boundary)

	fmt.Fprintf(&b, "--%s\r\n", boundary)
	b.WriteString("Content-Type: text/plain; charset=UTF-8\r\n\r\n")
	b.WriteString(text)
	b.WriteString("\r\n\r\n")

	fmt.Fprintf(&b, "--%s\r\n", boundary)
	b.WriteString("Content-Type: text/html; charset=UTF-8\r\n\r\n")
	b.WriteString(html)
	b.WriteString("\r\n\r\n")

	fmt.Fprintf(&b, "--%s--\r\n", boundary)

	return b.String()
}
