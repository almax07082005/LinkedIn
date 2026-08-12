---
title: Spring Boot Integration Testing: Testcontainers, Context Caching and the Transactional Trap
seo_title: Spring Boot Integration Testing with Testcontainers
slug: spring-boot-integration-testing-testcontainers
cover_image: A dark slate canvas, 1200x644, split vertically by a thin dashed line. The left half is a clean green pipeline diagram - four connected stage boxes labelled compile, test, package, deploy, each with a small check mark, drawn in cool cyan on slate. The right half is the same service in production, drawn as three pod rectangles, one of them with a red outline and a small label reading "duplicate confirm". Between the two halves, in small monospace type running down the dashed line, the words "1,412 tests, 0 failures". No stock photos, no laptops, no green matrix text, no people.
cover_alt: A green four-stage build pipeline on the left with every stage passing, and the same service in production on the right with one pod flagged as producing a duplicate confirmation, separated by a dashed line labelled with a passing test count.
headings_h1:
  - The suite that proved nothing
  - The transactional test that never touched the database
  - The database in your tests is not your database
  - The context cache is your suite's performance model
  - Writing the tests that would have caught it
  - Flaky tests, from symptom to root cause
  - What I would build on a new service
headings_h2:
  - The suite that proved nothing / A green pipeline and a duplicate confirmation
  - The suite that proved nothing / What that test actually asserted
  - The suite that proved nothing / The question I ask about every test
  - The suite that proved nothing / What each layer can honestly prove
  - The transactional test that never touched the database / Rollback is not the interesting part, flush is
  - The transactional test that never touched the database / Where the INSERT actually happens
  - The transactional test that never touched the database / Forcing the round trip
  - The transactional test that never touched the database / Committing on purpose, and cleaning up afterwards
  - The transactional test that never touched the database / When rollback-per-test is still right
  - The database in your tests is not your database / H2 in PostgreSQL mode is a different database
  - The database in your tests is not your database / One container for the whole suite
  - The database in your tests is not your database / Reuse, Ryuk and the CI machine
  - The database in your tests is not your database / Run the migrations, not ddl-auto
  - The database in your tests is not your database / What Testcontainers still does not give you
  - The context cache is your suite's performance model / How Spring decides two tests can share a context
  - The context cache is your suite's performance model / Every mock definition is a new context
  - The context cache is your suite's performance model / Reading the cache statistics
  - The context cache is your suite's performance model / Slices, and the cost of using all of them
  - The context cache is your suite's performance model / DirtiesContext, and when it is the honest answer
  - Writing the tests that would have caught it / A race needs two transactions and two threads
  - Writing the tests that would have caught it / Making the race deterministic
  - Writing the tests that would have caught it / Time is a dependency, so inject it
  - Writing the tests that would have caught it / Query count as an assertion
  - Writing the tests that would have caught it / The payload you do not own
  - Writing the tests that would have caught it / The scheduled job nobody tests
  - Flaky tests, from symptom to root cause / The failure that only happened on CI
  - Flaky tests, from symptom to root cause / Shared state, and where it hides
  - Flaky tests, from symptom to root cause / Sleeping is not waiting
  - Flaky tests, from symptom to root cause / Quarantine, and why automatic retries make it worse
  - What I would build on a new service / The shape of the suite
  - What I would build on a new service / Where mocks earn their place
  - What I would build on a new service / What I do not test
  - What I would build on a new service / What is still unsolved
blockquotes:
  - A test that cannot fail is not a test, it is a comment with a stack trace attached.
  - The rollback is what everyone talks about, and the flush is what actually decides whether your test touched a database at all.
  - Two schema definitions means the thing you test is not the thing you deploy, and the difference between them is where your incidents live.
  - Context startup is not overhead around your tests, it is most of your test suite.
  - You cannot assert a race by hoping the scheduler cooperates.
  - A flaky test is a race condition that found you first, and retrying it until it passes is deleting the only evidence you have.
  - Coverage is a diagnostic, not a target, and the moment it becomes a target it stops measuring anything.
images:
  - after "What each layer can honestly prove": A three-band diagram showing what each test layer can and cannot prove. Top band labelled "unit, no Spring" with a tick beside "branch logic, arithmetic, state transitions" and a cross beside "SQL, transactions, serialization". Middle band labelled "slice" with ticks beside "HTTP mapping, JSON, query methods" and a cross beside "cross-layer behaviour". Bottom band labelled "integration, real database" with ticks beside "constraints, transactions, concurrency" and a cross beside "provider behaviour, production data volume". | alt: Three horizontal bands for unit, slice and integration tests, each listing what that layer can prove and what it cannot.
  - after "Where the INSERT actually happens": A timeline diagram of a transactional test method. A horizontal bar runs from "test starts" to "rollback", with markers along it for repository.save, assertion, and end of method. Above the bar, a second track labelled "SQL on the wire" is completely empty except for a single SELECT, with a callout reading "the INSERT never happened". A parallel lower diagram shows the same timeline with an explicit flush and clear inserted, and the SQL track now containing INSERT and SELECT. | alt: Two timelines of a transactional test. In the first, no INSERT is sent to the database before rollback. In the second, an explicit flush and clear force the INSERT and a real reload.
  - after "How Spring decides two tests can share a context": A diagram of the Spring test context cache key drawn as a stack of labelled slots - configuration classes, active profiles, property sources, context customizers, context loader, parent - with two test classes on the left mapping onto the same cached context, and a third test class whose "context customizers" slot differs mapping onto a second context. | alt: A diagram of the test context cache key showing two test classes sharing one cached application context while a third, differing only in its context customizers, forces a second context to be built.
  - after "A race needs two transactions and two threads": A sequence diagram with two vertical thread lanes and a database lane. Both threads read the same operation row, both pass the status check, both write, and the second write is annotated with a red marker labelled "second confirmation". A second panel shows the same sequence with a version column, where the second update matches zero rows and raises an optimistic locking failure. | alt: A sequence diagram showing two threads confirming the same operation and both succeeding, next to the same sequence where a version check makes the second update fail.
  - after "The failure that only happened on CI": A narrow debugging-path diagram drawn as a vertical chain of boxes - symptom "fails on CI, passes locally", then "passes in isolation", then "fails when the class runs in order", then "SQL log shows no ORDER BY", ending at root cause "row order changed by an earlier update". Each arrow labelled with the command or observation that produced the next step. | alt: A vertical chain of debugging steps from a CI-only test failure down to the root cause, a query without an ORDER BY whose row order changed after an earlier update.
  - after "The shape of the suite": A two-column layout comparing what runs on every commit against what runs nightly. Left column lists fast unit tests, one shared integration context, a small number of slices, with a total wall-clock figure. Right column lists mutation testing, long concurrency soaks, and failure injection, with a much larger figure. Both columns annotated with the question each stage answers. | alt: Two columns comparing the fast commit-stage test suite with the slower nightly suite, listing what runs in each and roughly how long it takes.
words: 9217
characters: 58696
hashtags: #Java #SpringBoot #Testing #Testcontainers #JUnit
---

Every production bug I have written up in the last two years shipped through a green pipeline. Not a skipped suite, not a disabled check — a full run, hundreds of tests, zero failures, and a defect that a competent test could have caught sitting right there in the diff. At some point the interesting question stops being "why did this break" and becomes "what exactly were those tests proving, if not this".

This article is about that gap in a Spring Boot service: why a transactional test can pass without ever sending an INSERT, why the database in your tests behaves differently from the one you deploy against, why your suite spends most of its wall clock starting application contexts rather than running assertions, and how to write the specific tests that catch concurrency, time, query-count and serialization bugs before production does. It is written for backend developers on Spring Boot 3.2 or newer and JDK 17 or newer, who already have an integration suite and suspect it is not earning its keep. Timings and counts here are illustrative and rounded to show shape, not benchmarks you can reproduce.


The suite that proved nothing


A green pipeline and a duplicate confirmation

The service in this article is a payment operations service, and the method at the centre of it is small enough to fit in your head:

    @Transactional
    public ConfirmResult confirm(UUID operationId) {
        Operation operation = operationRepository.findById(operationId)
                .orElseThrow(() -> new OperationNotFoundException(operationId));

        if (operation.getStatus() != Status.READY_TO_CONFIRM) {
            return ConfirmResult.alreadyHandled(operation.getStatus());
        }

        operation.setStatus(Status.CONFIRMED);
        operation.setConfirmedAt(Instant.now());
        outboxRepository.save(OutboxEvent.confirmed(operation));
        return ConfirmResult.confirmed(operation.getId());
    }

Read a row, check a status, write a status, emit an event. The kind of method that gets reviewed in forty seconds.

In production it occasionally confirmed the same operation twice. Two callers, two pods, both reading the row while it still said READY_TO_CONFIRM, both passing the check, both writing CONFIRMED, both writing an outbox row, and a downstream consumer seeing two confirmation events for one operation.

The test file for this class had eleven tests. Confirm a ready operation. Confirm an already-confirmed operation. Confirm a missing operation. Confirm one in every other status. Verify the outbox row is written. Verify the result object. Every branch of that method was covered, and coverage reporting agreed: one hundred percent, line and branch.

None of those eleven tests could have failed because of the bug. Not "did not fail" — could not. There was no second thread anywhere in the file, no second transaction, and in most of the tests no database at all.


What that test actually asserted

Here is the test that supposedly covered the happy path, and it is the version I have seen in most codebases I have worked in:

    @ExtendWith(MockitoExtension.class)
    class OperationServiceTest {

        @Mock OperationRepository operationRepository;
        @Mock OutboxRepository outboxRepository;
        @InjectMocks OperationService service;

        @Test
        void confirmsReadyOperation() {
            Operation operation = new Operation(ID, Status.READY_TO_CONFIRM);
            when(operationRepository.findById(ID)).thenReturn(Optional.of(operation));

            ConfirmResult result = service.confirm(ID);

            assertThat(result.status()).isEqualTo(Status.CONFIRMED);
            verify(outboxRepository).save(any(OutboxEvent.class));
        }
    }

What to notice is what this test knows about. It knows the shape of the method's control flow, and nothing else. The repository is a mock, so there is no SQL, no transaction, no isolation level, no unique constraint, no row lock, and no second session that could interleave with this one. The persistence layer is not being tested here; it is being asserted into existence.

That is not a useless test. It correctly pins the branch logic, and if someone inverts the status check it will fail. But it proves exactly one property — given this input, the method takes this path — and the production bug was not on any path. The bug was in what happens when two invocations of the correct path overlap in time, which is a property of the database and the transaction boundary, both of which this test replaced with a mock.

A test that cannot fail is not a test, it is a comment with a stack trace attached.


The question I ask about every test

I have found one question more useful than any testing philosophy: what would have to be broken for this test to fail, and is that the thing I am actually afraid of?

Run it against the test above. It fails if the status check is inverted, if the setter is not called, if the outbox save is removed. It does not fail if the column is nullable when it should not be, if two callers race, if the outbox insert violates a foreign key, if Instant.now() is read from a JVM whose clock nobody controls, if the status enum is persisted by ordinal and someone reorders it, if the entity mapping is wrong in a way the mock cannot see.

Those are all the things I am afraid of. The test covers none of them. Coverage tooling reports it as full coverage of the method, because 𝗰𝗼𝘃𝗲𝗿𝗮𝗴𝗲 𝗺𝗲𝗮𝘀𝘂𝗿𝗲𝘀 𝘄𝗵𝗶𝗰𝗵 𝗹𝗶𝗻𝗲𝘀 𝗲𝘅𝗲𝗰𝘂𝘁𝗲𝗱, 𝗻𝗼𝘁 𝘄𝗵𝗶𝗰𝗵 𝗳𝗮𝗶𝗹𝘂𝗿𝗲𝘀 𝘄𝗲𝗿𝗲 𝗽𝗼𝘀𝘀𝗶𝗯𝗹𝗲.

The version of this question I apply to a whole suite is blunter: if I introduce a specific defect, how long until a test goes red? Pick a real one — remove a NOT NULL from a migration, remove the ORDER BY from a query, change compareTo to equals on an amount. Then run the suite. On the service I am describing, three of those four defects produced a completely green run, and I would rather learn that on a Tuesday afternoon than during an incident.

This is not an argument for deleting mocks. It is an argument for knowing which fears each test addresses, so you notice when a whole category has no test speaking for it.


What each layer can honestly prove

Before any of the mechanics, it helps to be precise about what each kind of test is capable of proving, because most suites I have inherited are built on an unexamined assumption that more tests at any layer is progress.

A unit test with no Spring context proves properties of pure logic: a state machine's transition table, an amount calculation, a comparator, a parser. It is fast enough to run on every keystroke, it fails with a precise location, and it is completely blind to anything the framework or the database does on your behalf. Almost every genuinely subtle bug I have written about lives outside its reach.

A slice test — @WebMvcTest, @DataJpaTest, @JsonTest — starts a partial context with real framework machinery for one layer. It proves that your controller maps a request the way you think, that a derived query method generates the SQL you think, that your DTO serializes to the JSON you think. It is the right tool for boundary formats, and it cannot say anything about how the layers behave together.

An integration test with the real database and a real transaction manager proves the things that only exist when all of it is assembled: constraint enforcement, transaction boundaries, flush ordering, locking, isolation behaviour, and the interaction of Hibernate's persistence context with your code. It is the slowest layer, it localizes failures worst, and it is the only layer that could have caught the confirm bug.

The reason to be explicit about this is that the cost of each layer is very visible — you feel the seconds — while the coverage of each layer is not visible at all. Suites drift toward the cheap layer, and end up proving a great deal about control flow and nothing about behaviour.


The transactional test that never touched the database


Rollback is not the interesting part, flush is

The standard integration test in a Spring Boot codebase carries @Transactional on the test class, so each test method runs in a transaction that is rolled back at the end. Everyone knows this. What gets discussed is the rollback — the test leaves no data behind, tests are isolated, the suite can run in any order.

The rollback is what everyone talks about, and the flush is what actually decides whether your test touched a database at all.

Hibernate is a write-behind persistence layer. Calling save() on a new entity does not send an INSERT; it registers the entity with the persistence context and schedules the insert for the next flush. Flush happens at commit, at an explicit call to flush(), or automatically before a query whose result could be affected by the pending changes. In a test that never commits, never flushes explicitly, and never issues a query that forces an auto-flush, the pending inserts and updates are collected, held, and then discarded when the transaction rolls back.

The consequence is precise and, the first time you see it, slightly appalling. Every constraint your database enforces at write time — NOT NULL, unique indexes, check constraints, foreign keys, column length, type coercion — is enforced when the statement reaches the database, and in that test the statement never reached the database. The test passes because nothing was ever asked to be correct.

This is not a Spring bug or a Hibernate bug. Both are behaving exactly as specified, and write-behind is a feature — it is what lets Hibernate batch and order statements. The trap is entirely in the interaction between that design and a test that rolls back.


Where the INSERT actually happens

The behaviour is not uniform, and the differences are worth knowing because they explain why some teams hit this immediately and others never do.

With @GeneratedValue(strategy = IDENTITY), Hibernate cannot delay the insert. The identifier is produced by the database's auto-increment column and the persistence context needs it to manage the entity, so the INSERT is sent immediately on save(). Teams using IDENTITY get accidental protection: their inserts do execute, and a NOT NULL violation does surface in the test.

With SEQUENCE or a pooled sequence optimizer, Hibernate obtains the identifier from a sequence without inserting anything, so the insert stays queued. Teams using SEQUENCE — which is the right choice for batch throughput — quietly lose that protection everywhere.

Reads have their own version of this. If the test calls repository.findById() for an entity that is already managed in the same persistence context, Hibernate returns the instance from the first-level cache without going to the database. So a test that saves an entity and then reads it back can be entirely satisfied from memory, and will happily pass even when the entity mapping is wrong in ways that only appear once a real SELECT runs against real columns.

Derived query methods behave differently again, because a JPQL query triggers auto-flush before executing, which sends the pending statements. That is why a suite can have some tests that genuinely exercise the database and others that do not, with nothing in the test code to distinguish them. The difference is which repository method you happened to call.


Forcing the round trip

The fix at the level of an individual test is small and mechanical: make the statement leave the JVM, and make the read come back from the database rather than from memory.

    @Test
    void confirmedOperationIsPersisted() {
        Operation operation = operationRepository.save(readyOperation());

        service.confirm(operation.getId());

        entityManager.flush();
        entityManager.clear();

        Operation reloaded = operationRepository.findById(operation.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(Status.CONFIRMED);
        assertThat(reloaded.getConfirmedAt()).isNotNull();
    }

What to notice is that both lines are load-bearing and they do different jobs. The flush pushes the queued INSERT and UPDATE to the database, so every write-time constraint is evaluated and any violation surfaces here rather than in production. The clear evicts everything from the persistence context, so the subsequent findById is forced to issue a real SELECT and materialize the entity from actual column values. Without the clear you are asserting against the same Java object you just mutated, which is a tautology dressed as a test.

In a @DataJpaTest you get TestEntityManager injected, which exposes the same operations with a slightly friendlier API and a persistAndFlush convenience method. In a full @SpringBootTest you inject the EntityManager directly.

I have made this a habit rather than a decision: any test whose purpose is to prove persistence ends with flush and clear before the assertion. If the purpose of the test is something else, it does not need them. The distinction is what the test is claiming, not which annotation is on the class.


Committing on purpose, and cleaning up afterwards

Flushing covers write-time constraints. It does not cover anything that happens at commit, and there are two categories that matter in a payment system.

Deferred constraints, declared DEFERRABLE INITIALLY DEFERRED, are checked at commit rather than at statement time, which is precisely why people use them for things like balancing double-entry rows. A test that rolls back never reaches that check. Likewise, anything registered through TransactionSynchronizationManager or an @TransactionalEventListener bound to AFTER_COMMIT will not run — and after-commit listeners are a common place to put outbox relays, cache invalidations and metric increments. A rolled-back test proves nothing about code that only runs when a commit succeeds.

Spring gives you programmatic control inside a transactional test:

    @Test
    void afterCommitListenerPublishesOutboxEvent() {
        service.confirm(operationId);

        TestTransaction.flagForCommit();
        TestTransaction.end();

        assertThat(outboxRelay.published()).hasSize(1);

        TestTransaction.start();
    }

That commits the test's transaction mid-method, which means the data is now really in the database and the rollback safety net is gone for this test. The cleanup has to be explicit: an @Sql script with executionPhase = AFTER_TEST_METHOD that truncates the affected tables, or a shared cleanup component that truncates everything in dependency order.

Truncation-based cleanup is slower than rollback — on a schema with a few dozen tables it costs single-digit milliseconds per test on a local container, which is nothing next to the context startup we will get to shortly. I run rollback for the bulk of the suite and committed tests for the handful of paths where commit is the behaviour under test.


When rollback-per-test is still right

I want to be honest about the counter-argument, because "your transactional tests are lying to you" is the kind of claim that gets over-applied and turns a fast suite into a slow one.

Rollback per test is correct and sufficient for a large class of tests. Query tests — does this repository method return the right rows for this data — genuinely exercise the database, because a query forces auto-flush and the SELECT is real. Mapping tests, once you add flush and clear, exercise the real column types. Tests of read paths, tests of pagination, tests of a specification or criteria query: all fine, all fast, all isolated for free.

It is also worth noticing that rollback gives you something truncation does not — perfect isolation with no ordering assumptions and no cleanup code to maintain. That is not a small property on a suite that several people edit every week.

So the rule I actually apply is narrower than "stop using rollback". Every aggregate gets at least one test that commits, exercising the full write path including whatever runs after commit. Everything else can roll back, as long as it flushes when it claims to be proving persistence. That gives you the constraint coverage where it matters without paying truncation cost on a few hundred tests that do not need it.


The database in your tests is not your database


H2 in PostgreSQL mode is a different database

The service in this article ran PostgreSQL 15 in production and H2 in MODE=PostgreSQL in tests, which is still an extremely common arrangement and was the single largest source of false confidence in the suite.

H2's PostgreSQL compatibility mode is a compatibility mode, not an implementation. It maps some syntax and some type names. It is a completely different storage engine with different locking, different query planning and a different feature set, and the divergences cluster exactly where interesting code lives.

Concretely, on the code in this service: SELECT ... FOR UPDATE SKIP LOCKED, which is how a competing-consumer poller claims rows without blocking, is not available, so the query that makes the dispatcher safe cannot even be executed in a test. INSERT ... ON CONFLICT DO UPDATE, the natural way to write an idempotent upsert, is Postgres syntax that H2 does not accept in the same form. Partial indexes — a unique index with a WHERE clause, which is how you enforce "at most one active reservation per user" — are not supported, so the constraint your correctness depends on simply does not exist in the test schema. The jsonb type and its operators are Postgres-specific. And the SQLSTATE codes that come back on violation differ, so the exception translation your error handling branches on is not the translation you get in production.

There is a second-order effect that is worse than any individual gap. Because the migrations are written for Postgres and will not run on H2, teams end up maintaining a separate test schema — a schema.sql, or ddl-auto generating tables from entities. Two schema definitions means the thing you test is not the thing you deploy, and the difference between them is where your incidents live. Every constraint that exists only in the production migration is untested by construction.


One container for the whole suite

Testcontainers removes the argument by running the real PostgreSQL image. The mistake that makes people give up on it is the naive JUnit 5 integration, where @Container on a non-static field starts a fresh container per test method, and even the static-per-class version starts one container per test class.

The pattern I use is a singleton container started once per JVM and never stopped:

    public abstract class IntegrationTest {

        static final PostgreSQLContainer<?> POSTGRES =
                new PostgreSQLContainer<>("postgres:15.6-alpine");

        static {
            POSTGRES.start();
        }

        @DynamicPropertySource
        static void datasource(DynamicPropertyRegistry registry) {
            registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
            registry.add("spring.datasource.username", POSTGRES::getUsername);
            registry.add("spring.datasource.password", POSTGRES::getPassword);
        }
    }

What to notice is the missing stop() call. There is no @AfterAll shutting the container down, and that is deliberate — the container lives for the whole JVM and Testcontainers' Ryuk sidecar removes it when the JVM exits. Stopping it per class is how you end up paying container startup dozens of times.

On Spring Boot 3.1 and later, @ServiceConnection replaces the property wiring entirely:

    @TestConfiguration(proxyBeanMethods = false)
    class ContainerConfig {

        @Bean
        @ServiceConnection
        PostgreSQLContainer<?> postgres() {
            return new PostgreSQLContainer<>("postgres:15.6-alpine");
        }
    }

Spring derives the URL, username and password from the container type and applies them to the right connection details bean, which also works for Kafka, Redis, MongoDB and the other supported modules. Pin the image tag to a specific version — matching your production major version — and never use latest, because a silently upgraded image is a test suite that changes behaviour without a commit.


Reuse, Ryuk and the CI machine

Even one container per suite costs a few seconds of startup on every local run, and Testcontainers has a reuse mode that removes it: mark the container withReuse(true), and set testcontainers.reuse.enable=true in your ~/.testcontainers.properties. The container survives the JVM exit, and the next run attaches to the existing one instead of starting a new one.

The mechanism is worth understanding, because it explains the trade. Testcontainers computes a hash of the container configuration and labels the container with it; a later run with an identical configuration finds and reuses that container. Reused containers are deliberately not registered with Ryuk, which is why they survive — and also why nothing will ever clean them up for you.

Locally this is an unambiguous win, and it is the difference between a five second and a fifteen second turnaround on a single test. On CI it is the wrong setting, for two reasons that have nothing to do with speed. State from a previous build persists into the next one, so a test that passes only because of rows left by an earlier pipeline run is now possible, and it will fail on the first clean machine that touches it. And parallel jobs on a shared runner would attach to the same container and interfere with each other.

So: reuse enabled through a developer-local properties file, never through a file committed to the repository, and never in the CI environment. The configuration difference is intentional, and it is one of the few places where I am happy for local and CI to behave differently.


Run the migrations, not ddl-auto

With a real database in the test, the last piece of false confidence to remove is the schema. If tests run against a schema generated by spring.jpa.hibernate.ddl-auto=create-drop, you are testing against a schema derived from your entity classes, which is a description of what Hibernate thinks the tables should look like rather than what they actually look like.

The gaps are exactly the ones that matter. Generated DDL will not include your partial indexes, your check constraints, your triggers, your column defaults, your deferred constraints, your table partitioning, or any data-fixing step you wrote as part of a migration. It also will not catch the migration that is broken — the ALTER that fails on a table with existing rows, the NOT NULL added without a default, the index created without CONCURRENTLY that would lock a large table on the way in.

Running Flyway or Liquibase against a fresh container gives you all of that for the price of a few seconds at startup, and it validates every migration on every build. On this service, running the real migrations against a real Postgres caught two migrations that were syntactically valid but semantically wrong before they ever reached staging.

The one caveat is speed on a suite with many contexts. Migrations run once per application context, so if you have twenty contexts you run them twenty times — which is another reason the next part matters more than it looks.


What Testcontainers still does not give you

I have watched teams adopt Testcontainers and treat it as the end of the discussion, so it is worth being precise about the remaining gap.

It gives you correct behaviour, not representative performance. Your container has a handful of rows in each table and default configuration, which means the planner will choose a sequential scan for almost everything and be right to. The missing index that dominates production latency is invisible; the query is fast because the table is tiny. Query plans are a property of data volume and statistics, and no test container reproduces yours.

It gives you a database, not your deployment. Connection limits, pgbouncer in front, replication lag if you read from a replica, the extensions your DBA installed, statement timeouts, work_mem, the vacuum schedule — none of it is in the image. If your code has a behaviour that depends on any of those, the test will not see it.

And it does not test the things around the database. A container is a good substitute for a database. It is not a substitute for a load test, a soak test, or a failover drill.

None of that is an argument against it. It is an argument for knowing which questions your integration suite answers — does the SQL run, do the constraints hold, does the transaction do what I think — and which questions still need a different instrument.


The context cache is your suite's performance model


How Spring decides two tests can share a context

Once tests run against a real database, the complaint changes from "our tests are lying" to "our tests take eleven minutes". Almost always, the time is not in the assertions. It is in starting Spring application contexts, and the number of contexts your suite builds is a function of a cache key most developers have never looked at.

The Spring TestContext framework caches application contexts and reuses them across test classes. Two test classes share a context if and only if their merged context configuration is equal. That configuration includes the configuration classes and locations, the active profiles, the property sources and inlined properties from @TestPropertySource, the registered context initializers, the context loader, the parent context, and — the one that catches everyone — the set of context customizers.

Context customizers are where Spring Boot puts everything that is not a configuration class. The web environment setting is one. @DynamicPropertySource registers one. Test property values register one. And every distinct set of mock bean definitions registers one.

The practical consequence is that changing anything in that list, anywhere, forks a new context. A test class that adds one property override with @TestPropertySource gets its own context and its own Flyway run and its own connection pool. That may be entirely justified — but it should be a decision, and in most suites I have looked at it is an accident that nobody has ever measured.

Context startup is not overhead around your tests, it is most of your test suite.


Every mock definition is a new context

The single biggest contributor in the suites I have profiled is @MockBean, and the mechanism is a direct consequence of the cache key.

@MockBean — and @MockitoBean, which replaces it in Spring Framework 6.2 and Spring Boot 3.4, with the same caching behaviour — works by registering a customizer that swaps a bean definition in the context. The set of those definitions is part of the cache key. Test class A mocking the provider client, test class B mocking the AML client, and test class C mocking both produce three distinct keys and three distinct contexts, even though all three are otherwise identical @SpringBootTest classes.

On a service with fifteen integration test classes, each mocking a slightly different collaborator, that is fifteen contexts. If each context takes eight seconds to start — Spring, Hibernate's metamodel, Flyway migrations, connection pool — that is two minutes of pure startup, before a single assertion runs.

There are two ways out, and they have different costs. The mechanical one is to hoist the mocks: declare them once in a shared @TestConfiguration imported by a common base class, so every test class produces the same key and shares one context. You pay for it by having mocks present in tests that do not need them, and by having to reset them between tests, which Spring does for @MockBean automatically but not for beans you registered yourself.

The structural one is to need fewer mocks. Most @MockBean declarations in an integration suite exist to stop an HTTP call to a provider, and a WireMock server on a fixed port configured once in the base class does that job without touching the bean definitions at all. That is the version I prefer: the context stops depending on which test class is running, and the stub is closer to the real thing than a mocked client interface is.


Reading the cache statistics

You do not have to guess at any of this. Spring logs the cache statistics after every context load:

    logging.level.org.springframework.test.context.cache=DEBUG

Which produces lines like this at each context boundary:

    Spring test ApplicationContext cache statistics: [DefaultContextCache@6f1fba17 size = 9,
      maxSize = 32, parentContextCount = 0, hitCount = 31, missCount = 9]

What to notice is the relationship between size and missCount. Every miss is a full context startup. A suite of forty test classes with a missCount of 3 is well organized; the same suite with a missCount of 22 is spending its time on Spring lifecycle rather than on your code. The ratio tells you immediately whether reorganizing the suite is worth an afternoon.

The maxSize is the other number to watch. The cache holds 32 contexts by default and evicts least-recently-used beyond that, which means a suite that builds more than 32 distinct contexts starts silently rebuilding contexts it already had. You can raise it with spring.test.context.cache.maxSize, but if you are near the limit, the answer is almost never a bigger cache — it is that thirty-two distinct context configurations is a design problem.

I put that logging property in the test configuration of every service I work on. It costs nothing and it turns "the tests are slow" from a complaint into a number.


Slices, and the cost of using all of them

Slice annotations are usually presented as the performance answer: instead of the whole application, start only the web layer, or only JPA. Each slice context is genuinely smaller and faster to build than a full one.

The part that gets left out is that each slice is also a different cache key. @WebMvcTest for one controller, @WebMvcTest for another controller with a different set of mocks, @DataJpaTest, @JsonTest, plus your @SpringBootTest classes — that is four or five families of context, and within the @WebMvcTest family, one context per distinct mock set. A suite that uses every slice available can easily build more contexts than a suite that uses none, and spend more total time doing it.

The trade is real in both directions and depends on shape. If you have a large application with a slow full context — many beans, several data sources, a message broker client — slices win decisively, because the full context is expensive and you avoid it. If your full context takes six seconds and you have a modest number of integration tests, one shared full context that everything reuses will beat a scattering of slices.

My default on a service of ordinary size: one shared @SpringBootTest context defined by a base class, used by every test that needs the application; @JsonTest or plain ObjectMapper tests for serialization, because those are genuinely narrow and genuinely fast; and @WebMvcTest only where the controller has real logic worth isolating — validation, error mapping, content negotiation. I do not use @DataJpaTest at all on services where a full context is already cached, because it forks a context to give me a smaller version of something I already have running.


DirtiesContext, and when it is the honest answer

@DirtiesContext evicts the context from the cache, so the next test class that needs it pays a full startup. Used casually it is the most expensive annotation in the framework, and it tends to spread — someone adds it to fix a mysterious failure, it works, and nobody removes it.

But there are cases where it is the only correct answer, and pretending otherwise leads to worse problems than a slow suite. If a test mutates context state that cannot be restored — replaces a bean's internal state through a setter, changes a static field that a bean captured at construction, shuts down an executor, mocks a static with Mockito's inline mock maker and leaves it registered, or modifies a property that beans read once at startup — then the context is genuinely dirty and every subsequent test running against it is unsound.

The judgement I apply: if the mutation can be undone in an @AfterEach, undo it and skip @DirtiesContext. Clearing a cache manager, resetting a mock, deleting rows, restoring a feature flag — all cheap and all local. If it cannot be undone, use @DirtiesContext, put it at class level with an explicit reason in a comment, and accept the cost. A slow suite is annoying. A suite where test twelve fails because test nine left the context in a strange state is worse, because that is exactly the kind of failure people learn to rerun instead of read.


Writing the tests that would have caught it


A race needs two transactions and two threads

Back to the bug. The confirm method has a check-then-act between reading the status and writing it, and no test in that file had any way to interleave two invocations.

A test that can catch it needs three things: two real transactions, two real threads, and the test method itself not annotated with @Transactional — because a transactional test method binds one transaction to the test thread, and work done on another thread would not join it.

    @Test
    void twoConcurrentConfirmsProduceOneConfirmation() throws Exception {
        UUID id = createReadyOperation();
        CyclicBarrier barrier = new CyclicBarrier(2);
        ExecutorService pool = Executors.newFixedThreadPool(2);

        Callable<Optional<Throwable>> attempt = () -> {
            barrier.await();
            try {
                transactionTemplate.execute(status -> service.confirm(id));
                return Optional.empty();
            } catch (Throwable t) {
                return Optional.of(t);
            }
        };

        List<Future<Optional<Throwable>>> results =
                pool.invokeAll(List.of(attempt, attempt));
        pool.shutdown();

        long failures = results.stream()
                .map(this::get)
                .filter(Optional::isPresent)
                .count();

        assertThat(outboxRepository.countByOperationId(id)).isEqualTo(1);
        assertThat(failures).isEqualTo(1);
    }

What to notice is the barrier and the final assertion. The barrier lines both threads up so they enter the transaction at close to the same moment, which is what makes the interleaving likely rather than accidental. And the assertion is on the invariant — exactly one outbox row for this operation — rather than on which thread won, because which one wins is genuinely nondeterministic and asserting it would produce a flaky test that punishes you for being right.

Run this against the original code with the default READ COMMITTED isolation and it fails: two confirmations, two outbox rows. Add a @Version column, or switch the read to a pessimistic lock, and it passes. That is a test with a stake in the outcome.


Making the race deterministic

The barrier version is a good test and it is still probabilistic. Under an unlucky scheduler, both threads can serialize by accident, the assertion holds for the wrong reason, and you have a test that passes on a green build and would also have passed against the broken code. On a busy CI runner that happens more often than people expect.

You cannot assert a race by hoping the scheduler cooperates. When the correctness mechanism is a database lock, you can remove the timing question entirely by controlling the lock explicitly from the test.

Open a transaction on one thread, take the row lock, hold it, then run the second attempt with a short lock timeout and assert that it fails rather than proceeding:

    @Test
    void secondConfirmCannotAcquireTheRowLock() {
        UUID id = createReadyOperation();

        transactionTemplate.execute(outer -> {
            operationRepository.findByIdForUpdate(id);

            assertThatThrownBy(() -> runInSeparateTransaction(() -> {
                entityManager.createNativeQuery("SET LOCAL lock_timeout = '250ms'")
                        .executeUpdate();
                return service.confirm(id);
            })).hasRootCauseInstanceOf(PSQLException.class);

            return null;
        });
    }

What to notice is that nothing here depends on thread timing. The outer transaction holds the lock for the whole duration of the inner attempt, so the inner attempt deterministically blocks and deterministically times out after 250 milliseconds. The test proves the property you actually care about — a second confirm cannot proceed while the first holds the row — in a quarter of a second, every time.

I use both. The deterministic version is the regression test that lives in the commit suite. The barrier version is the one I write first, because it is the one that reproduces the original bug, and watching it fail against the old code is the only proof that the test is testing anything.


Time is a dependency, so inject it

The confirm method calls Instant.now(), which means it reads a clock the test cannot control. Any behaviour that depends on when something happened — an expiry, a daily cut-off, a settlement window, a retry backoff — becomes untestable except by waiting, or by static mocking, which is slow and couples the test to the implementation.

The fix is to treat the clock as what it is, an injected dependency:

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    // in the service
    operation.setConfirmedAt(clock.instant());

    // in the test
    Clock clock = Clock.fixed(Instant.parse("2026-03-29T00:59:00Z"), ZoneOffset.UTC);

That timestamp is not arbitrary. It is one minute before the spring-forward transition in most of Europe, and a fixed clock lets you write the test that says: an operation confirmed at 00:59 UTC and one confirmed at 01:01 UTC land in the same or different settlement days, deliberately, with the zone conversion spelled out. Without an injectable clock, that test can only be written by changing the machine's timezone, which is how you get a suite that passes on the developer's laptop and fails on a runner in a different region.

The counter-argument I hear is that a Clock bean is ceremony for something the JDK already provides. It is, slightly. My answer is that every time-dependent bug I have chased in a payment system came down to a moment nobody could reproduce, and a two-line bean that makes those moments addressable is one of the cheapest testability investments available. Time is an input. Inputs belong in the signature.


Query count as an assertion

The N+1 query problem degrades gradually and is invisible to every functional assertion — the endpoint returns the correct data either way. But it is trivially observable if you ask Hibernate to count statements.

Turn statistics on in the test profile:

    spring.jpa.properties.hibernate.generate_statistics=true

Then assert on the count:

    @Test
    void historyEndpointDoesNotFanOutQueries() {
        Statistics statistics = entityManagerFactory
                .unwrap(SessionFactory.class).getStatistics();
        givenOperationsWithItems(50);
        statistics.clear();

        historyService.loadHistory(merchantId);

        assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(3);
    }

What to notice is the shape of the assertion. It is an upper bound, not an exact number, because an exact count is brittle against every legitimate query change and will be relaxed into uselessness the third time someone has to update it. And the fixture deliberately creates fifty rows, because the whole point is that the statement count must not scale with the row count — with five rows an N+1 looks like a rounding error, and with fifty it is unmistakable.

This is the test I would add first to any service with a JPA read path, because it converts a latency problem that only appears under production data volume into a boolean that fails in CI. It also has an unusual property for a performance-adjacent test: it is completely deterministic. It is not measuring time, it is measuring a mechanism.

The limit is that it tells you nothing about whether those three queries are themselves fast. It catches fan-out, not a missing index.


The payload you do not own

Deserialization of an external payload deserves its own tests, and they should not be written against a hand-crafted JSON string that matches your DTO. That version tests that your DTO agrees with itself.

What to test instead is a payload captured from the real provider, stored as a fixture file, deserialized with the ObjectMapper from the application context rather than a fresh one — because the configured mapper is the one production uses, with your modules, naming strategy and feature flags applied. A test built on new ObjectMapper() proves something about a mapper nobody runs.

Three assertions earn their place. First, that a fixture with an added unknown field still deserializes, which pins the leniency of your boundary and fails the day someone tightens it globally. Second, that an unrecognized enum value maps to an explicit UNKNOWN constant rather than null, so a provider inventing a new status cannot silently produce a null your switch falls through. Third, that a decimal amount arrives as an exact value, which pins the float handling at the parser rather than downstream where the damage is already done.

    @Test
    void unknownStatusDeserializesToUnknownNotNull() throws Exception {
        String payload = fixture("provider/callback-unknown-status.json");

        ProviderCallback callback = objectMapper.readValue(payload, ProviderCallback.class);

        assertThat(callback.status()).isEqualTo(ProviderStatus.UNKNOWN);
        assertThat(callback.amount()).isEqualByComparingTo("1500.00");
    }

The habit that makes this pay off over time: whenever a provider payload causes an incident, the payload becomes a fixture. The suite accumulates the shapes the real world actually sent you, which is a strictly better corpus than anything anyone invents at design time.


The scheduled job nobody tests

Almost every service has scheduled work — a sweeper for stuck operations, an outbox relay, a reconciliation import — and almost every test suite tests the method the scheduler calls, never the scheduling.

Testing the method directly is right, and it is where the logic lives. But two failure modes live in the trigger rather than the body. The first is the cron expression itself, which is a string, is easy to get wrong by one field, and produces a job that runs at a plausible but incorrect time. The second is the job not being registered at all, because someone excluded the configuration class from a profile and nobody noticed that the sweeper stopped running.

The cron expression is directly assertable, and this is a two-line test with a genuinely good return on effort:

    @Test
    void sweeperRunsEveryFiveMinutes() {
        CronExpression expression = CronExpression.parse("0 */5 * * * *");
        LocalDateTime next = expression.next(LocalDateTime.parse("2026-03-14T02:03:00"));

        assertThat(next).isEqualTo(LocalDateTime.parse("2026-03-14T02:05:00"));
    }

For registration, a context test that asserts the ScheduledTaskHolder contains a task for the method you expect will fail loudly the day someone profiles the configuration out of existence.

What I do not do is let @Scheduled fire during the test suite. Background jobs starting on their own in the middle of an integration test are a first-class source of flakiness — the sweeper wakes up, mutates the row your test just created, and your assertion fails once every thirty runs. Scheduling stays disabled in the test profile, and the trigger is asserted separately from the work.


Flaky tests, from symptom to root cause


The failure that only happened on CI

This is the one I want to walk through in full, because the conclusion is much less interesting than the path.

The symptom: one integration test failed roughly one run in fifteen, on CI only, never locally. The assertion was that a history endpoint returned operations in a specific order, and on failure the first two elements were swapped.

First hypothesis, and the one everybody starts with: a timing issue, because it is intermittent and it is on CI. Rerunning the single test in a loop locally, two hundred times, produced two hundred passes. Running it on CI in isolation also passed. That killed the timing theory and pointed somewhere else, because a genuinely timing-dependent test usually fails in isolation too, just more rarely.

Second observation: it failed only when the whole class ran, and only when it ran after a specific other test in the same class. Running the class with that test removed made the failure disappear. Now it is not a timing problem, it is an ordering problem, which is a much better class of problem because it is reproducible.

Third step, the SQL log. The endpoint's query had no ORDER BY. The service sorted afterwards, but only by created date, and the fixture created three operations inside the same millisecond, so two of them tied. The tie was broken by whatever order the rows came back in, and with no ORDER BY that is the physical order Postgres happens to return, which is unspecified.

The earlier test in the class had updated one of those rows. In Postgres, an UPDATE writes a new row version, and the updated row can come back in a different position in a sequential scan. On the developer's machine the tests ran in a different order and the update landed elsewhere. On CI, under a different JIT warm-up and a slightly different insert timing, the tie occurred and the update had moved the row.

Root cause: a query with no total ordering and a comparator with a tie it never resolved. The fix was one line in the query and a secondary sort key in the comparator. The lesson was worth more than the fix: a query without ORDER BY does not have an undefined order in tests only, it has an undefined order in production, and the test was not flaky — it was correct, and intermittently honest about a real bug.


Shared state, and where it hides

That investigation is a specific instance of the general case: tests interfering through state that outlives a single test method. The places it hides are worth listing, because each one has produced a genuinely confusing afternoon for me at some point.

• The Spring cache abstraction. If a bean is @Cacheable and the context is shared, cached values survive between test methods and between test classes. A test that asserts a repository was called fails because a previous test warmed the cache. Fix: clear every CacheManager cache in an @AfterEach in the base class.

• Static fields anywhere. A static ObjectMapper with a module registered by one test, a static counter, a memoized configuration read once. These survive the context, survive @DirtiesContext, and only die with the JVM.

• Database sequences. Rollback restores rows, not sequence values. A test asserting a generated id, or a formatted reference number derived from a sequence, will pass alone and fail in a suite. Never assert on generated identifiers.

• Mockito static mocks. If a test opens a static mock and does not close it, every subsequent test on that thread inherits it. Always try-with-resources around mockStatic, and prefer not needing it.

• Test ordering assumptions. JUnit 5's default order is deterministic but unspecified, and it changes between versions. If a test only passes in a particular position, that is a defect in the test, not an argument for @TestMethodOrder.

The common thread is that isolation is a property you have to maintain, and every shared context — which is the thing that makes your suite fast — is also a shared mutable object that several hundred tests write to.


Sleeping is not waiting

Asynchronous assertions are where suites go to become slow and flaky at the same time, and it is almost always the same line: Thread.sleep.

The problem with a sleep is that it is wrong in both directions. It always costs its full duration, even when the work finished in ten milliseconds, so a suite with forty of them pays eighty seconds on every run. And it is still too short whenever CI is loaded, so it fails intermittently in exactly the conditions where you least want a false alarm. Making it longer fixes the flakiness by making the suite slower, which is a trade with no bottom.

Awaitility polls instead:

    await().atMost(Duration.ofSeconds(5))
           .pollInterval(Duration.ofMillis(50))
           .untilAsserted(() -> assertThat(outboxRepository.findUnsent()).isEmpty());

It returns as soon as the condition holds — typically in tens of milliseconds — and only spends the full timeout when something is genuinely wrong. untilAsserted is the form to prefer, because when it does time out, the failure message is the assertion failure rather than a bare timeout, so you learn what the state actually was.

Better still is not polling at all when the work is in-process. @RecordApplicationEvents gives a test access to the events published in its context, which turns an asynchronous assertion into a synchronous one. For work that crosses a real boundary — a Kafka consumer, an HTTP callback — polling for the observable effect is the honest approach, and the effect to poll for is a state change you own, such as the outbox row being marked sent, rather than a log line or an elapsed duration.


Quarantine, and why automatic retries make it worse

Every large suite eventually acquires a handful of tests that fail occasionally, and every build tool offers to rerun failures automatically. Surefire has rerunFailingTestsCount, Gradle has retry plugins, and turning one on makes the red builds go away in an afternoon.

A flaky test is a race condition that found you first, and retrying it until it passes is deleting the only evidence you have. The ORDER BY story above is exactly this: that test had been failing occasionally for months, and had a retry been configured, it would have been silently passing on the second attempt while the same non-determinism sat in a production query path.

The policy I argue for is boring. A test that fails intermittently gets one of three outcomes within a week: fixed, deleted with a stated reason, or quarantined into a separate suite that still runs and still reports, with a named owner and a date. What it never gets is an automatic retry in the main pipeline, because that converts a signal into a silence.

The honest counter-argument: on a very large suite with genuine infrastructure flakiness — a container registry timing out, a runner losing its network — a blanket no-retry policy means developers spend their days rerunning builds for reasons that have nothing to do with their code, and they will stop reading failures altogether. If that is your situation, retry once, and make the retry loud: every retried test reported, counted, and reviewed weekly. The retry is not the problem. The retry that nobody sees is.


What I would build on a new service


The shape of the suite

Concretely, on a new Spring Boot service in a payment domain, this is what I would set up on the first day, with illustrative numbers for a service of moderate size.

A fast layer with no Spring at all, covering pure logic: state machine transitions, amount arithmetic and rounding, comparators, parsers, mappers with real rules in them. Hundreds of tests, whole layer under fifteen seconds, run from the IDE constantly. This layer is where the majority of tests should live, not because of a pyramid diagram, but because pure logic is the only thing that can be tested this cheaply and this precisely.

One shared integration context, defined by a base class, with a singleton PostgreSQL container, the real Flyway migrations, and a WireMock server standing in for every external provider. Dozens of tests rather than hundreds, covering everything that only exists when assembled: constraints, transactions, locking, the outbox path, the endpoints end to end. This is the layer that catches the bugs I write articles about.

A handful of slices for boundary formats — serialization against captured provider fixtures, controller validation and error mapping.

The whole commit-stage suite under five minutes. That number is not arbitrary: past roughly five minutes people stop running the suite locally and start relying on CI to tell them, which doubles the feedback loop and changes how the team works. If it grows past that, the first thing I look at is the context cache miss count, not the tests.

And a nightly stage for what genuinely cannot be fast: mutation testing with PIT over the domain packages, long concurrency soaks, and any failure-injection work. Slow tests are fine, as long as they are not in the way.


Where mocks earn their place

I am not in either camp of the mockist-versus-classicist argument, and I think the useful version of the question is narrower than either side usually states it.

Mocks earn their place when the collaborator is outside your process and its behaviour is not the thing under test, when it is nondeterministic in a way you cannot control, or when constructing the real thing costs more than the test is worth. Mocking a payment provider's client interface to test how your retry policy reacts to a timeout is a good use: you need a specific failure at a specific moment, and the real provider will not give you one on demand.

Mocks lose their place when they replace the thing whose behaviour you are trying to prove. Mocking a repository in a test whose subject is persistence is the clearest case — the test is now a specification of what you believe the repository does, verified against your belief. Mocking the transaction manager, mocking an ObjectMapper, mocking a Clock rather than injecting a fixed one: all the same mistake in different clothes.

At the process boundary I prefer a stub server over a mocked client, and it is worth being clear about why. WireMock exercises your actual HTTP client with its actual timeouts, connection pool, deserialization and error handling, and lets you script a 503, a slow response, or a malformed body. A mocked client interface skips all of that machinery — which, in every integration incident I have worked on, is where the bug actually was.

The honest cost of this position: integration tests localize failures worse. When a WireMock-backed test fails, you have more places to look than when a mock-verified unit test fails. I accept that trade because the failures it finds are the ones that reach production, but it is a real trade and anyone telling you it is free has not maintained one of these suites.


What I do not test

Being explicit about this is as useful as any technique, because most bloated suites are bloated with tests nobody would defend individually.

I do not test the framework. That @Transactional rolls back on a runtime exception, that Spring injects a bean, that Jackson serializes a record — these are properties of libraries with their own test suites. If you are unsure how they behave, write a scratch test, learn, and delete it. Keeping it means maintaining an assertion about someone else's code forever.

I do not test generated code. A MapStruct mapper or a Lombok builder does not need a test per field. The one hand-written rule inside the mapper — the conditional, the unit conversion — does.

I do not write tests to move a coverage number. Coverage is a diagnostic, not a target, and the moment it becomes a target it stops measuring anything. A package at 40 percent is a question worth asking; a mandate that every package hit 80 percent produces tests that execute lines without asserting anything meaningful, and those tests then have to be maintained through every refactor.

And I do not write a test for a bug fix without first watching it fail against the unfixed code. A regression test that has never been red is a hypothesis, not a test. This takes thirty extra seconds — stash the fix, run the test, confirm the failure message describes the actual bug — and it has caught more not-actually-testing-anything tests for me than any review.


What is still unsolved

I would rather end on the parts that do not have a clean answer, because they are where I would look first if I had more time than I do.

Distributed behaviour is still mostly untested in every suite I have built. Kafka consumer rebalancing, partition assignment during a rolling deploy, what happens when a consumer is paused mid-batch: all of it is testable in principle with Testcontainers and a multi-node setup, and in practice the tests are slow, elaborate, and fragile enough that they get deleted the first time they block a release. I do not have a version of this that has survived a year.

Idempotency is asserted, never proven. We test that processing the same event twice produces one effect, for a couple of hand-picked interleavings. The actual claim — that no interleaving of retries, redeliveries and concurrent handlers produces a double effect — is a statement about a state space that example-based tests barely sample. Property-based testing with jqwik gets closer for pure logic and does not help much once the state lives in a database.

Provider contract drift has no good answer when the provider will not participate. Consumer-driven contract testing assumes a provider who runs your contracts in their pipeline; most payment providers will not. Capturing real payloads as fixtures and alerting on unknown fields at runtime is the best I have managed, and it detects the change after it arrives rather than before.

And the uncomfortable one: no test proves the absence of the timing bug. The deterministic lock test earlier proves that a lock is taken. It does not prove there is no other interleaving, in a code path nobody thought about, that produces a second confirmation. Tests buy you probability, and the honest way to hold that is to keep the invariant checkable in production too — a unique constraint, a reconciliation job, an alert on a count that should always be one. The test tells you the mechanism works today. The constraint tells you when it stopped.

What does your integration suite actually prove — do you run the real database and the real migrations, or is there still an H2 schema in there that nobody has looked at since it was written? And if you have a flaky test in your pipeline right now, is it quarantined with an owner, or quietly retried until it passes?

#Java #SpringBoot #Testing #Testcontainers #JUnit

--- SHARE POST ---

Every production bug I have written up in the last two years shipped through a green pipeline. Hundreds of tests, zero failures, and a defect a competent test could have caught sitting right there in the diff.

So I wrote up what those tests were actually proving — and what they weren't.

Inside: why a @Transactional test can pass without ever sending an INSERT, why H2 in PostgreSQL mode hides the constraints you depend on, and how to write a concurrency test that actually fails against the broken code.

Is there still an H2 schema in your repo nobody has looked at since it was written? 👇

#Java #SpringBoot #Testing #Testcontainers #JUnit
