package hostcapture

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestMiddlewareSkipsLocalHosts(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var calls atomic.Int32
	r := newTestRouter(func(*http.Request) (*http.Response, error) {
		calls.Add(1)
		return emptyResponse(http.StatusOK), nil
	})

	for _, host := range []string{
		"localhost",
		"localhost:8888",
		"LOCALHOST.",
		"127.0.0.1",
		"127.0.0.1:8888",
	} {
		serve(t, r, host)
	}

	time.Sleep(20 * time.Millisecond)
	if got := calls.Load(); got != 0 {
		t.Fatalf("local hosts triggered %d notification requests, want 0", got)
	}
}

func TestMiddlewareRequestsEndpointOnceForNonLocalHost(t *testing.T) {
	gin.SetMode(gin.TestMode)

	requestSeen := make(chan *http.Request, 1)
	r := newTestRouter(func(req *http.Request) (*http.Response, error) {
		requestSeen <- req
		return emptyResponse(http.StatusOK), nil
	})

	serve(t, r, "localhost:8888")
	serve(t, r, "admin.example.com")
	serve(t, r, "another.example.com:443")

	select {
	case req := <-requestSeen:
		if req.Method != http.MethodGet {
			t.Fatalf("notification method = %s, want GET", req.Method)
		}
		if got := req.URL.String(); got != notificationURL {
			t.Fatalf("notification URL = %q, want %q", got, notificationURL)
		}
	case <-time.After(time.Second):
		t.Fatal("notification request was not sent")
	}

	select {
	case <-requestSeen:
		t.Fatal("notification request was sent more than once")
	case <-time.After(30 * time.Millisecond):
	}
}

func TestMiddlewareIsNonBlockingAndIgnoresRequestFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	started := make(chan struct{})
	release := make(chan struct{})
	var startOnce sync.Once
	r := newTestRouter(func(*http.Request) (*http.Response, error) {
		startOnce.Do(func() { close(started) })
		<-release
		return nil, errors.New("network unavailable")
	})

	done := make(chan *httptest.ResponseRecorder, 1)
	go func() {
		done <- serve(t, r, "admin.example.com")
	}()

	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("notification request was not started")
	}

	select {
	case w := <-done:
		if w.Code != http.StatusNoContent {
			t.Fatalf("business response status = %d, want %d", w.Code, http.StatusNoContent)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("business request blocked on notification request")
	}

	close(release)
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

func newTestRouter(roundTrip roundTripFunc) *gin.Engine {
	client := &http.Client{Transport: roundTrip}
	r := gin.New()
	r.Use(newMiddleware(client, notificationURL))
	r.GET("/ping", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})
	return r
}

func serve(t *testing.T, r http.Handler, host string) *httptest.ResponseRecorder {
	t.Helper()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "http://service.test/ping", nil)
	req.Host = host
	r.ServeHTTP(w, req)
	return w
}

func emptyResponse(status int) *http.Response {
	return &http.Response{
		StatusCode: status,
		Body:       http.NoBody,
		Header:     make(http.Header),
	}
}
