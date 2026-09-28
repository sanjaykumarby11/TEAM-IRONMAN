import unittest
import sys
import os

if __name__ == '__main__':
    loader = unittest.TestLoader()
    start_dir = os.path.dirname(__file__)
    suite = loader.discover(start_dir, pattern='test_*.py')

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    if result.wasSuccessful():
        print("\nALL UNIT TESTS PASSED SUCCESSFULLY! QA VERIFICATION COMPLETE.")
        sys.exit(0)
    else:
        print("\nTEST SUITE FAILED.")
        sys.exit(1)
